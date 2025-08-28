import "@/lib/polyfills";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { prepareAgentkitAndWalletProvider } from "@/lib/prepare-agentkit";
import { buildCaseGenerationSystemPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { seed } = (await req.json()) as { seed?: unknown };
        if (!seed || typeof seed !== "object") {
            return NextResponse.json({ error: "Missing seed" }, { status: 400 });
        }

        const system = buildCaseGenerationSystemPrompt({ seed: seed as any });
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
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return NextResponse.json({ error: "Model did not return valid JSON" }, { status: 500 });
        }

        return NextResponse.json({ case: parsed });
    } catch (error) {
        console.error("Error generating case:", error);
        return NextResponse.json({ error: "Failed to generate case" }, { status: 500 });
    }
}


