import OpenAI from "openai";
import { NEAR_AUTH } from "./app/config";

async function testNearAPIWithDocs() {
    console.log("Testing NEAR AI exactly per docs.near.ai/agents/integration");
    console.log("Auth (first 50 chars):", NEAR_AUTH.substring(0, 50) + "...");

    // Step 1: Initialize client exactly as per NEAR docs
    const openai = new OpenAI({
        baseURL: "https://api.near.ai/v1",
        apiKey: NEAR_AUTH,
    });

    const assistant_id = "likelyuser9518.near/CrimeFiles-Suspect-Isha_Kapoor/latest";

    try {
        // Step 2: Create a Thread (per NEAR docs)
        const thread = await openai.beta.threads.create();
        console.log("Thread created:", thread.id);

        // Step 3: Add Messages to the Thread (per NEAR docs)
        const message = await openai.beta.threads.messages.create(
            thread.id,
            {
                role: "user",
                content: "Hi Isha, can you introduce yourself and your role in the missing ledger case?"
            }
        );
        console.log("Message added:", message.id);

        // Step 4: Run the Assistant on the Thread (per NEAR docs)
        // Using createAndPoll as shown in docs
        const run = await openai.beta.threads.runs.createAndPoll(
            thread.id,
            {
                assistant_id: assistant_id,
            }
        );
        console.log("Run completed with status:", run.status);

        // Step 5: Process Assistant Responses (per NEAR docs)
        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(
                run.thread_id
            );
            console.log("Conversation:");
            for (const message of messages.data.reverse()) {
                console.log(`${message.role} > ${message.content[0].type === 'text' ? message.content[0].text.value : 'Non-text content'}`);
            }
        } else {
            console.log("Run status:", run.status);
            if (run.last_error) {
                console.log("Error:", run.last_error);
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

testNearAPIWithDocs().catch(console.error);
