export type AgentRequest = { userMessage: string };

export type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

export type AgentResponse = { response?: string; threadId?: string; error?: string };
