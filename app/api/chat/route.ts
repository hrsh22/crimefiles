import "@/lib/polyfills";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { prepareAgentkitAndWalletProvider } from "@/lib/prepare-agentkit";
import { buildSuspectSystemPrompt } from "@/lib/prompts";
import type { AgentResponse, ChatMessage } from "@/types/api";
import { getCaseById } from "@/app/case-files/cases";
import type { CaseFile, Suspect } from "@/app/case-files/cases";
// import { getLatestGeneratedCase } from "@/lib/generated-store";


export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse<AgentResponse>> {
    try {
        const { caseId, suspectId, messages, case: providedCase } = (await req.json()) as {
            caseId?: string;
            suspectId?: string;
            messages?: ChatMessage[];
            case?: Partial<CaseFile>;
        };

        if (!caseId || !suspectId || !messages || messages.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields: caseId, suspectId, messages" },
                { status: 400 },
            );
        }

        let caseFile: CaseFile | undefined;
        if (providedCase) {
            const raw = providedCase as Partial<CaseFile>;
            const suspects: Suspect[] = (Array.isArray(raw.suspects) ? raw.suspects : []).map((s, i) => ({
                id: s?.id ?? `s${i + 1}`,
                name: s?.name ?? `Suspect ${i + 1}`,
                description: s?.description,
                age: s?.age ?? 22 + i,
                occupation: s?.occupation ?? "Unknown",
                image: s?.image ?? `/assets/suspects/${((i % 3) + 1)}.png`,
                gender: s?.gender ?? "M",
                traits: s?.traits ?? [],
                mannerisms: s?.mannerisms ?? [],
            }));
            caseFile = {
                id: raw.id ?? (caseId || "case"),
                title: raw.title ?? "Generated Case",
                excerpt: raw.excerpt ?? "",
                story: raw.story ?? "",
                hints: Array.isArray(raw.hints) ? raw.hints : [],
                suspects,
            };
        } else {
            caseFile = getCaseById(caseId);
        }
        if (!caseFile) {
            return NextResponse.json({ error: "Invalid caseId" }, { status: 400 });
        }
        const suspect = caseFile.suspects.find((s) => s.id === suspectId);
        if (!suspect) {
            return NextResponse.json({ error: "Invalid suspectId" }, { status: 400 });
        }

        const model = openai("gpt-4.1-mini");
        const { agentkit } = await prepareAgentkitAndWalletProvider();
        const tools = getVercelAITools(agentkit);
        const maxSteps = 10;

        const system = buildSuspectSystemPrompt({ caseFile, suspect });

        const { text } = await generateText({
            model,
            tools,
            maxSteps,
            system,
            messages,
        });

        const response = sanitizePlainText(text);
        return NextResponse.json({ response });
    } catch (error) {
        console.error("Error processing chat request:", error);
        return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
    }
}

function sanitizePlainText(input: string): string {
    // Strip any XML/HTML-like tags and surrounding quotes
    const noTags = input.replace(/<[^>]+>/g, " ");
    const normalized = noTags.replace(/\s+/g, " ").trim();
    return normalized.replace(/^[\'\"“”‘’]+|[\'\"“”‘’]+$/g, "");
}
