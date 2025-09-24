import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function sanitizeForTts(input: string): string {
    let text = String(input || "");
    // Remove stage directions and actions between asterisks, brackets, or parentheses
    text = text.replace(/\*[^*]*\*/g, " ");
    text = text.replace(/\[[^\]]*\]/g, " ");
    text = text.replace(/\([^)]*\)/g, " ");
    // Collapse whitespace and strip surrounding quotes
    text = text.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "").replace(/\s+/g, " ").trim();
    return text;
}

// Supported voices: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'verse', 'ballad', 'ash', 'sage', 'marin', 'cedar'
function pickVoice(gender?: string): "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "coral" | "verse" | "ballad" | "ash" | "sage" | "marin" | "cedar" {
    const g = (gender || "").toUpperCase();
    if (g === "F" || g === "FEMALE") {
        // use a brighter/feminine voice
        return "nova";
    }
    // deeper/masculine default
    return "alloy";
}

export async function POST(req: Request): Promise<Response> {
    try {
        const { text, gender }: { text?: string; gender?: string } = await req.json();
        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }
        const cleaned = sanitizeForTts(text);
        if (!cleaned) {
            return NextResponse.json({ error: "Nothing to speak after sanitization" }, { status: 400 });
        }

        const client = new OpenAI();
        const mp3 = await client.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: pickVoice(gender),
            input: cleaned,
        });
        const arrayBuffer = await mp3.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("TTS error:", error);
        return NextResponse.json({ error: "Failed to synthesize speech" }, { status: 500 });
    }
}
