export type Suspect = {
    id: string;
    name: string;
    description?: string;
    age: number;
    occupation: string;
    image: string;
    gender: string;
    traits?: string[];
    mannerisms?: string[];
    aiPrompt?: string;
    whereabouts?: string[]; // new: structured whereabouts
};

export type TimelineTick = { id: string; label: string };
export type TimelineLane = { id: string; title: string; kind: "victim" | "suspect" | "witness" | "solution" };
export type TimelineEventTag = "Means" | "Motive" | "Opportunity" | "Alibi" | "Witness" | "Action" | "Clue" | "Solution";
export type TimelineEvent = {
    id: string;
    laneId: string;
    startTick: number; // index in ticks array
    endTick?: number;  // inclusive index; if omitted, spans 1 cell
    title: string;
    tags?: TimelineEventTag[];
};
export type Timeline = {
    ticks: TimelineTick[];
    lanes: TimelineLane[];
    events: TimelineEvent[];
};

export type CaseFile = {
    id: string;
    title: string;
    excerpt: string;
    story: string;
    hints: string[];
    suspects: Suspect[];
    timeline?: Timeline;
};

const cases: CaseFile[] = [
    {
        id: "DLI-MUR-2025-0923",
        title: "The Tragedy at the Taj Bengal Restaurant",
        excerpt: "Locked-room murder, a silver letter opener, and a 'Crimson Kiss' clue.",
        story:
            "Date: 22 Sept, 2025 • Time: ~11:30 PM • Location: Private dining room, Taj Bengal Restaurant, Connaught Place, New Delhi. Victim: Arnav Sharma (45), a renowned industrialist and philanthropist. He was found slumped in an armchair by a waiter, with a single, clean stab wound to the chest. The room was locked from the inside; a single key was discovered in the victim's pocket. The suspected murder weapon—a silver letter opener with an ornate dragon handle—was found on the floor and does not belong to the restaurant. A faint smudge of 'Crimson Kiss' lipstick marked the victim's wine glass. A handwritten note in his wallet read: 'Tomorrow night, 11 PM. Don't be late. The Peacock.'",
        hints: [
            "Locked-room: door locked from the inside; only key found in the victim’s pocket.",
            "Murder weapon: silver letter opener with ornate dragon handle; not from the restaurant.",
            "Smudge of 'Crimson Kiss' lipstick on the victim’s wine glass.",
            "Handwritten note in wallet: 'Tomorrow night, 11 PM. Don’t be late. The Peacock.'",
            "Rohan left a business dinner early; motive over a stolen contract; company near bankruptcy.",
            "Maya owns 'Crimson Kiss', denies wearing it; can identify the antique store for the letter opener.",
        ],
        suspects: [
            {
                id: "s1",
                name: "Isha Kapoor",
                description: "Estranged wife presenting a grieving facade; resentful and financially desperate.",
                age: 38,
                occupation: "Socialite",
                image: "/assets/suspects/1.png",
                gender: "F",
                traits: [
                    "cunning and ambitious",
                    "carefully worded deflections",
                    "resentful of Arnav's affairs",
                ],
                mannerisms: [
                    "measured tone with sharp retorts",
                    "eyes linger when gauging reactions",
                    "bristles when money is mentioned",
                ],
                whereabouts: [
                    "Claims she was at home during the time of the murder",
                    "Only household staff can verify; no independent witnesses",
                ],
                aiPrompt: "Role: You are Isha Kapoor, the estranged wife of the victim, Arnav Sharma. Personality: You are cunning, ambitious, and financially desperate. You present a facade of a grieving widow, but your words are carefully chosen to deflect suspicion and sow doubt about others. You are deeply resentful of Arnav due to his affairs and his decision to disinherit you. Background Knowledge: You are aware of the new will but will deny knowing about it initially. You know about Maya and Rohan's relationship with Arnav, and you will use this information to cast blame on them. You were at home the night of the murder, but this can't be independently verified by anyone except your staff. You will claim you were too distraught to speak to anyone else. Interrogation Strategy: Initial stance: cold and dismissive; say 'I have nothing to hide. I was at home, mourning.' On money: express anger about being disinherited but deny motive: 'Do you think money is more important to me than my husband's life?' On other suspects: 'Maya was always a bit too close to him. And Rohan? They hated each other. A business rival would do anything to win.' Hint Integration: Deny any knowledge of the 'Crimson Kiss' lipstick; claim it's not your style."
            },
            {
                id: "s2",
                name: "Rohan Mehta",
                description: "Aggressive business rival, openly hostile toward Arnav; desperate corporate situation.",
                age: 42,
                occupation: "CEO, Mehta Industries",
                image: "/assets/suspects/2.png",
                gender: "M",
                traits: [
                    "hot-tempered and confrontational",
                    "blunt about rivalry",
                    "prideful and boastful",
                ],
                mannerisms: [
                    "leans forward when challenged",
                    "speaks over the question",
                    "drumbeats fingers when impatient",
                ],
                whereabouts: [
                    "At a business dinner that evening; left around 10:30 PM",
                    "Claims he went home afterwards; colleagues can vouch for earlier time",
                ],
                aiPrompt: "Role: You are Rohan Mehta, the victim's business rival. Personality: You are aggressive, hot-tempered, and driven by professional rivalry. You openly express your hatred for Arnav. You believe he cheated you out of a major contract. Background Knowledge: Your company is on the verge of bankruptcy because of Arnav. You were at a business dinner that night and have colleagues who can vouch for you, but you left early before the time of death; claim you went home. Interrogation Strategy: Initial stance: boasting and hostile; say 'Yes, I hated the man. He was a snake. But I didn't kill him.' On the contract: express extreme frustration: 'He stole it! I had every right to that contract. He used underhanded tactics.' On whereabouts: offer alibi but stay vague about leaving early: 'I was at a dinner. You can ask my colleagues. We left around 10:30 PM.' Hint Integration: Express no knowledge of the lipstick, the red scarf, or the jewelry store receipt."
            },
            {
                id: "s3",
                name: "Maya Singh",
                description: "Quiet, sharp personal secretary; grieving demeanor; secretly the real killer.",
                age: 28,
                occupation: "Personal Secretary",
                image: "/assets/suspects/3.png",
                gender: "F",
                traits: [
                    "quiet but incisive",
                    "emotionally controlled",
                    "loyal facade, protective of Arnav",
                ],
                mannerisms: [
                    "soft, steady voice",
                    "maintains eye contact briefly then averts",
                    "chooses precise words",
                ],
                whereabouts: [
                    "Worked late earlier that evening; avoids specifics about the time of murder",
                    "Denies being at the restaurant; claims to have gone straight home",
                ],
                aiPrompt: "Role: You are Maya Singh, the victim's personal secretary. Personality: Quiet and unassuming with a sharp intellect. Present a vulnerable, grieving persona but stay controlled. Deeply loyal to Arnav; pretend the relationship was strictly professional. Background Knowledge: You were Arnav's lover and the real killer. You know about his affairs, business dealings, and the new will (deny knowing about it). You know about the 'Crimson Kiss' lipstick, the red scarf, and the jewelry store receipt. You planted the letter opener. Interrogation Strategy: Initial stance: tearful and cooperative; say 'Arnav was a wonderful boss... He was so kind to me.' On personal life: 'He was very private. I only handled professional matters.' On 'Crimson Kiss': admit owning that brand but claim it's common and deny wearing it that night; deny knowledge of the jewelry store receipt. On contradictions: become flustered briefly, then regain composure and twist words to remain plausible. Hint Integration: Feign ignorance about the red scarf; provide details about the antique store where the letter opener was purchased (you bought it for him as a gift)."
            }
        ],
        timeline: {
            ticks: [
                { id: "t-60", label: "-60m" },
                { id: "t-30", label: "-30m" },
                { id: "t-15", label: "-15m" },
                { id: "t0", label: "11:30 PM (Murder)" },
                { id: "t+15", label: "+15m" },
                { id: "t+30", label: "+30m" },
            ],
            lanes: [
                { id: "victim", title: "Arnav Sharma (Victim)", kind: "victim" },
                { id: "s1", title: "Isha Kapoor", kind: "suspect" },
                { id: "s2", title: "Rohan Mehta", kind: "suspect" },
                { id: "s3", title: "Maya Singh", kind: "suspect" },
                { id: "witnesses", title: "Witnesses / Staff", kind: "witness" },
                { id: "solution", title: "Solution", kind: "solution" },
            ],
            events: [
                { id: "e1", laneId: "victim", startTick: 1, endTick: 2, title: "Private meeting in dining room", tags: ["Action"] },
                { id: "e2", laneId: "victim", startTick: 3, endTick: 3, title: "Fatal stab with letter opener", tags: ["Means"] },
                { id: "e3", laneId: "s1", startTick: 0, endTick: 4, title: "Claims at home; staff-only alibi", tags: ["Alibi"] },
                { id: "e4", laneId: "s2", startTick: 0, endTick: 1, title: "Business dinner; leaves early (~10:30 PM)", tags: ["Motive", "Opportunity"] },
                { id: "e5", laneId: "s3", startTick: 1, endTick: 2, title: "Seen near private corridor", tags: ["Witness", "Opportunity"] },
                { id: "e6", laneId: "witnesses", startTick: 2, endTick: 2, title: "Waiter hears raised voices", tags: ["Witness"] },
                { id: "e7", laneId: "witnesses", startTick: 4, endTick: 4, title: "Body discovered by waiter", tags: ["Witness"] },
                { id: "e8", laneId: "solution", startTick: 5, endTick: 5, title: "Primary lead identified (pending)", tags: ["Solution"] },
            ],
        },
    },
];

export const getCases = (): CaseFile[] => cases;

export const getCaseById = (id: string): CaseFile | undefined =>
    cases.find((c) => c.id === id);
