import { GeneratedCaseSeed } from "./case-seeds";

type BuildCaseGenPromptArgs = {
    seed: GeneratedCaseSeed;
};

/**
 * System prompt for generating a complete CaseFile JSON from a broad seed.
 * Output MUST be strict JSON matching CaseFile in app/case-files/cases.ts, with 3 suspects.
 */
export function buildCaseGenerationSystemPrompt({ seed }: BuildCaseGenPromptArgs): string {
    const seedSummary = {
        title: seed.title,
        excerpt: seed.excerpt,
        story: seed.story,
        hints: seed.hints,
        // Do not pass names; avoid biasing the model to role-based names
        suspects: seed.suspects.map(s => ({
            occupation: s.occupation,
            gender: s.gender,
        })),
    };

    return `
You are a writer generating a crime case file.

Goal: Produce STRICT JSON that matches the TypeScript type CaseFile in app/case-files/cases.ts.

Type shape:
{
  "id": string,
  "title": string,
  "excerpt": string,
  "story": string,
  "hints": string[],
  "guiltySuspectId": string,
  "crimestory": string,
  "suspects": Array<{
    "id": string,
    "name": string,
    "description"?: string,
    "age": number,
    "occupation": string,
    "image": string,
    "gender": string,
    "traits"?: string[],
    "mannerisms"?: string[]
  }>
}

Requirements:
- Use the provided seed as general context only. Expand details creatively.
- Keep it realistic and cohesive but avoid confession content.
- Generate exactly 3 suspects.
- Use images: "/assets/suspects/1.png", "/assets/suspects/2.png", "/assets/suspects/3.png" in order.
- Keep "id" fields as short strings (e.g., "g1", "s1", "s2", "s3").
- Keep lengths moderate: story ≤ 220 words; excerpt ≤ 30 words; hints 4–6 items.
- Output ONLY the JSON. No commentary.
 - For each suspect, "name" must be a realistic full human name (e.g., "Evelyn Hart"). Do NOT use roles or titles (e.g., not "The Curator"). Ensure "name" differs from "occupation".
 - Include a top-level field "guiltySuspectId" that is exactly equal to one suspect's "id". Do not state guilt in title, excerpt, story, or hints; keep it hidden in this field only.
 - Include a top-level field "crimestory" with a concise, evidence-based narrative (80–150 words) explaining why the suspect with id==guiltySuspectId is guilty. This should reference concrete clues (e.g., access anomalies, timestamps) without contradicting the public story/hints. Do not reveal this in other fields.

Seed to use (context): ${JSON.stringify(seedSummary)}
`;
}
