import "@/lib/polyfills";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { AgentResponse, ChatMessage } from "@/types/api";
import { NEAR_AUTH } from "@/app/config";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse<AgentResponse>> {
    try {
        const { suspectId, messages, threadId: providedThreadId } = (await req.json()) as {
            suspectId?: string;
            messages?: ChatMessage[];
            threadId?: string;
            // other fields ignored for NEAR AI flow
        };

        if (!suspectId || !messages || messages.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields: suspectId, messages" },
                { status: 400 },
            );
        }

        const assistantId = mapSuspectToAssistantId(suspectId);
        if (!assistantId) {
            return NextResponse.json(
                { error: "Unknown suspectId for NEAR AI assistant mapping" },
                { status: 400 },
            );
        }

        const client = new OpenAI({
            baseURL: "https://api.near.ai/v1",
            apiKey: NEAR_AUTH,
        });

        // Use provided thread id if any; else create new and seed with full history
        let threadId = (providedThreadId || "").trim();
        if (!threadId) {
            const thread = await client.beta.threads.create();
            threadId = thread.id;
            for (const m of messages) {
                const content = (m?.content ?? "").toString();
                if (!content) continue;
                await client.beta.threads.messages.create(threadId, {
                    role: m.role,
                    content,
                });
            }
        } else {
            // Append only the latest user message
            const last = messages[messages.length - 1];
            if (last) {
                const content = (last?.content ?? "").toString();
                if (content) {
                    await client.beta.threads.messages.create(threadId, {
                        role: last.role,
                        content,
                    });
                }
            }
        }

        const run = await client.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
        });

        if (run.status !== "completed") {
            return NextResponse.json({ error: run.status || "Run did not complete" }, { status: 500 });
        }

        const list = await client.beta.threads.messages.list(run.thread_id);
        const reply = extractAssistantReply(list?.data ?? []);
        const response = sanitizePlainText(reply || "");
        return NextResponse.json({ response: response || "", threadId });
    } catch (error) {
        console.error("Error processing chat request:", error);
        return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
    }
}

export async function GET(req: Request): Promise<NextResponse<{ messages?: { role: "user" | "assistant"; content: string }[]; error?: string }>> {
    try {
        const url = new URL(req.url);
        const threadId = (url.searchParams.get("threadId") || "").trim();
        if (!threadId) {
            return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
        }

        const client = new OpenAI({
            baseURL: "https://api.near.ai/v1",
            apiKey: NEAR_AUTH,
        });

        const list = await client.beta.threads.messages.list(threadId);
        const items = (list?.data ?? [])
            .map((m) => ({
                role: (m?.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: flattenMessageContent(Array.isArray(m?.content) ? m.content : []),
            }))
            .filter((m) => m.content && m.content.trim().length > 0);
        // Return from oldest to newest for UI simplicity
        const ordered = [...items].reverse();
        return NextResponse.json({ messages: ordered });
    } catch (error) {
        console.error("Error fetching thread messages:", error);
        return NextResponse.json({ error: "Failed to fetch thread messages" }, { status: 500 });
    }
}

function sanitizePlainText(input: string): string {
    // Strip any XML/HTML-like tags and surrounding quotes
    const noTags = input.replace(/<[^>]+>/g, " ");
    const normalized = noTags.replace(/\s+/g, " ").trim();
    return normalized.replace(/^[\'\"“”‘’]+|[\'\"“”‘’]+$/g, "");
}

function mapSuspectToAssistantId(suspectId: string): string | undefined {
    // Map known suspect ids to NEAR AI assistant ids
    const map: Record<string, string> = {
        s1: "likelyuser9518.near/CrimeFiles-Suspect-Isha_Kapoor/latest",
        s2: "likelyuser9518.near/CrimeFiles-Suspect-Rohan_Mehta/latest",
        s3: "likelyuser9518.near/CrimeFiles-Suspect-Maya_Singh/latest",
    };
    return map[suspectId];
}

type AssistantContentItem = { type: string; text?: { value?: string } };
type AssistantMessage = { role: string; content: AssistantContentItem[] };

function extractAssistantReply(messages: AssistantMessage[]): string | undefined {
    // Prefer the longest assistant text after cleaning log lines and prefixes
    const assistantTexts: string[] = [];
    for (const m of messages) {
        if (m?.role !== "assistant") continue;
        const parts = Array.isArray(m?.content) ? m.content : [];
        for (const p of parts) {
            if (p?.type === "text" && p?.text?.value) {
                const cleaned = cleanAgentText(p.text.value as string);
                if (cleaned) assistantTexts.push(cleaned);
            }
        }
    }
    if (assistantTexts.length === 0) {
        // Fallback: pick the longest cleaned text even if it looked like a log
        for (const m of messages) {
            if (m?.role !== "assistant") continue;
            const parts = Array.isArray(m?.content) ? m.content : [];
            for (const p of parts) {
                if (p?.type === "text" && p?.text?.value) {
                    const cleaned = cleanAgentText(p.text.value as string);
                    if (cleaned) assistantTexts.push(cleaned);
                }
            }
        }
    }
    return assistantTexts.sort((a, b) => b.length - a.length)[0];
}

function flattenMessageContent(parts: AssistantContentItem[]): string {
    const texts: string[] = [];
    for (const p of parts) {
        if (p?.type === "text" && p?.text?.value) {
            const cleaned = cleanAgentText(p.text.value as string);
            if (cleaned) texts.push(cleaned);
        }
    }
    const joined = texts.join("\n\n");
    return sanitizePlainText(joined);
}

function cleanAgentText(value: string): string {
    // Remove NEAR agent runner logs and prefixes within a text block
    const lines = String(value).split(/\r?\n/).map((l) => l.trim());
    const filtered = lines.filter((l) => {
        if (!l) return false;
        if (/^\d{4}-\d{2}-\d{2} .* - INFO - /.test(l)) return false;
        if (l.startsWith("Output file:")) return false;
        if (l.includes("[AGENT STDOUT]")) return false;
        if (/^Retrieved \d+ messages from cache$/.test(l)) return false;
        if (l.startsWith("Running agent ")) return false;
        return true;
    }).map((l) => l.replace(/^ASSISTANT:\s*/i, "").trim());
    const cleaned = filtered.join("\n\n").trim();
    return cleaned.length > 0 ? cleaned : "";
}
