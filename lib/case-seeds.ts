export type GeneratedCaseSeed = {
    title: string;
    excerpt: string;
    story: string;
    hints: string[];
    suspects: Array<{
        name: string;
        description?: string;
        age: number;
        occupation: string;
        image: string;
        gender: "M" | "F" | "O";
        traits?: string[];
        mannerisms?: string[];
    }>;
};

// Generalized seed pools (broad categories; AI will craft specifics)
const locations = [
    "bank",
    "museum",
    "data center",
    "corporate office",
    "university lab",
    "hospital",
    "airport terminal",
];

const targets = [
    "ledger",
    "artifact",
    "prototype",
    "research dossier",
    "encryption key",
    "archives",
    "blueprints",
];

const incidentTypes = [
    "went missing",
    "was tampered with",
    "was exfiltrated",
    "was replaced",
    "was sabotaged",
];

const timeContexts = [
    "on audit eve",
    "during a gala night",
    "during maintenance hours",
    "right before opening",
    "overnight",
];

// Hints will be synthesized from selected categories (no static hint pool)

const roles = ["CFO", "IT Administrator", "Security Guard", "Curator", "Compliance Officer", "Finance Intern", "Research Lead"];
const genderPool = ["M", "F"] as const;

const traitPool = [
    "measured and formal",
    "risk-averse and reputation-conscious",
    "technically precise and procedural",
    "defensive about best practices",
    "eager to please",
    "admits uncertainty rather than risk being wrong",
];

const mannerismPool = [
    "speaks in concise, polished statements",
    "rarely uses contractions",
    "uses technical jargon and references logs",
    "corrects small inaccuracies",
    "uses filler like 'um' and 'I think'",
    "apologizes when challenged",
];

function sample<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function sampleMany<T>(arr: T[], count: number): T[] {
    const copy = [...arr];
    const picked: T[] = [];
    for (let i = 0; i < Math.min(count, copy.length); i++) {
        const idx = Math.floor(Math.random() * copy.length);
        picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
}

export function generateCaseSeed(): GeneratedCaseSeed {
    const location = sample(locations);
    const target = sample(targets);
    const incident = sample(incidentTypes);
    const time = sample(timeContexts);
    const hints = buildGenericHints(location, target, incident, time);

    const title = `The ${capitalizeFirst(incident.split(" ")[1] || incident)} ${capitalizeFirst(target)} at the ${capitalizeFirst(location)}`;
    const excerpt = `A ${target} ${incident} ${time} at the ${location}. Details appear ordinary, but something feels off.`;
    const story = `At ${time}, a ${target} at the ${location} ${incident}. Initial checks show routine activity, with anomalies requiring closer scrutiny.`;

    const suspects = Array.from({ length: 3 }).map((_, i) => {
        const occupation = sample(roles);
        const label = occupation.toLowerCase();
        return {
            name: `The ${occupation}`,
            description: i === 0 ? `Key stakeholder as the ${label}.` : i === 1 ? `Operational control as the ${label}.` : `Supporting role as the ${label}.`,
            age: 18 + Math.floor(Math.random() * 30),
            occupation,
            image: "/assets/suspects/" + ((i % 3) + 1) + ".png",
            gender: sample([...genderPool]),
            traits: sampleMany(traitPool, 2),
            mannerisms: sampleMany(mannerismPool, 2),
        };
    });

    return { title, excerpt, story, hints, suspects };
}

function capitalizeFirst(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildGenericHints(location: string, target: string, incident: string, time: string): string[] {
    const hints: string[] = [
        `unusual activity observed at the ${location} ${time}`,
        `access related to the ${target} shows inconsistencies`,
        `event sequence suggests the ${target} ${incident}`,
        `logs appear routine; anomalies likely clustered ${time}`,
    ];
    return hints.map(capitalizeFirst);
}

// Deterministic selection using on-chain randomness bytes
export function generateCaseSeedFromRandomBytes(bytes: Uint8Array): GeneratedCaseSeed {
    // simple rolling indexer
    let p = 0;
    const pick = (n: number) => {
        const v = bytes[p % bytes.length];
        p += 1;
        return v % n;
    };

    const location = locations[pick(locations.length)];
    const target = targets[pick(targets.length)];
    const incident = incidentTypes[pick(incidentTypes.length)];
    const time = timeContexts[pick(timeContexts.length)];
    const hints = buildGenericHints(location, target, incident, time);

    const title = `The ${capitalizeFirst(incident.split(" ")[1] || incident)} ${capitalizeFirst(target)} at the ${capitalizeFirst(location)}`;
    const excerpt = `A ${target} ${incident} ${time} at the ${location}. Details appear ordinary, but something feels off.`;
    const story = `At ${time}, a ${target} at the ${location} ${incident}. Initial checks show routine activity, with anomalies requiring closer scrutiny.`;

    const suspects = Array.from({ length: 3 }).map((_, i) => {
        const occupation = roles[pick(roles.length)];
        const label = occupation.toLowerCase();
        return {
            name: `Suspect ${i + 1}`,
            description: i === 0 ? `Key stakeholder as the ${label}.` : i === 1 ? `Operational control as the ${label}.` : `Supporting role as the ${label}.`,
            age: 18 + pick(30),
            occupation,
            image: "/assets/suspects/" + ((i % 3) + 1) + ".png",
            gender: genderPool[pick(genderPool.length)],
            traits: sampleMany(traitPool, 2),
            mannerisms: sampleMany(mannerismPool, 2),
        };
    });

    return { title, excerpt, story, hints, suspects };
}


