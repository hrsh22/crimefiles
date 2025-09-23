import "@/lib/polyfills";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { prepareAgentkitAndWalletProvider } from "@/lib/prepare-agentkit";
import { buildCaseGenerationSystemPrompt } from "@/lib/prompts";
import lighthouse from "@lighthouse-web3/sdk";
import { GeneratedCaseSeed } from "@/lib/case-seeds";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { seed } = (await req.json()) as { seed?: unknown };
        if (!seed || typeof seed !== "object") {
            return NextResponse.json({ error: "Missing seed" }, { status: 400 });
        }

        const system = buildCaseGenerationSystemPrompt({ seed: seed as GeneratedCaseSeed });
        const model = openai("gpt-4.1-mini");
        const { agentkit } = await prepareAgentkitAndWalletProvider();
        const tools = getVercelAITools(agentkit);
        const maxSteps = 10;

        const { text } = await generateText({
            model,
            tools,
            maxSteps,
            system,
            messages: [
                {
                    role: "user",
                    content: `Seed: ${JSON.stringify(seed)}`,
                },
            ],
        });

        // Expect strict JSON; attempt to parse
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");
        const raw = jsonStart >= 0 && jsonEnd >= 0 ? text.slice(jsonStart, jsonEnd + 1) : text;
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return NextResponse.json({ error: "Model did not return valid JSON" }, { status: 500 });
        }

        // Persist JSON to Lighthouse; use CID as case id
        const apiKey = process.env.LIGHTHOUSE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing LIGHTHOUSE_API_KEY" }, { status: 500 });
        }
        const name = `case`;
        console.log(JSON.stringify(parsed));
        const { guiltySuspectId, crimestory, ...publicCase } = parsed as Record<string, unknown> & { guiltySuspectId?: unknown; crimestory?: unknown };
        console.log("guiltySuspectId:", guiltySuspectId);
        console.log("crimestory:", crimestory);
        
        const uploadRes = await lighthouse.uploadText(JSON.stringify(publicCase), apiKey, name);
        const cid = uploadRes?.data?.Hash as string | undefined;
        if (!cid) {
            return NextResponse.json({ error: "Failed to upload to Lighthouse" }, { status: 500 });
        }
        (publicCase as { id: string }).id = cid;

        // Return only essentials with cid
        return NextResponse.json({ case: { id: cid, cid, title: publicCase.title as string, excerpt: publicCase.excerpt as string }, guiltySuspectId, crimestory });
    } catch (error) {
        console.error("Error generating case:", error);
        return NextResponse.json({ error: "Failed to generate case" }, { status: 500 });
    }
}
