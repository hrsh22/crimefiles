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
};

export type CaseFile = {
    id: string;
    title: string;
    excerpt: string;
    story: string;
    hints: string[];
    suspects: Suspect[];
};

const cases: CaseFile[] = [
    {
        id: "1",
        title: "The Missing Ledger",
        excerpt:
            "On the eve of an audit, the finance vault’s master ledger vanished without a trace.",
        story:
            "At 07:12, the finance team discovered the encrypted master ledger missing from the vault minutes before audit prep. The vault remained online; no intrusion alarms fired, and the recovery key register shows no rotation. Access telemetry highlights three unique user contexts interacting with the vault this week. The file’s last known state: locked, consistent checksum, and no partial download artifacts. The CFO requested a dry-run export yesterday; the IT Admin migrated the vault to hardware-token-only access two days earlier; and a new intern assisted with report formatting. Yet the audit folder shows a phantom rename event with no corresponding user agent. Someone knew exactly how to look ordinary while doing something extraordinary.",
        hints: [
            "Late-night VPN session overlaps with the vault’s access window by 17 minutes.",
            "Hardware token enrollment changed for one account; the old token wasn’t decommissioned.",
            "Helpdesk ticket about a coffee spill was filed at 08:03 referencing a disabled USB hub.",
            "Audit dry-run export was requested but never completed—logs show a cancelled job.",
            "The phantom rename used a locale rarely set in the company (en-GB).",
            "Checksum history indicates the ledger wasn’t modified—only moved or hidden.",
        ],
        suspects: [
            {
                id: "s1",
                name: "Evelyn Hart",
                description: "Holds final sign-off on audits.",
                age: 49,
                occupation: "CFO",
                image: "/assets/suspects/1.png",
                gender: "F",
                traits: [
                    "measured and formal",
                    "risk-averse and reputation-conscious",
                    "deflects with policy and governance talk",
                ],
                mannerisms: [
                    "speaks in concise, polished statements",
                    "rarely uses contractions",
                    "asks clarifying questions before answering",
                ],
            },
            {
                id: "s2",
                name: "Marcus Chen",
                description: "Migrated the vault to hardware-token-only access this week.",
                age: 38,
                occupation: "IT Administrator",
                image: "/assets/suspects/2.png",
                gender: "M",
                traits: [
                    "technically precise and procedural",
                    "defensive about best practices",
                    "prefers logs and evidence over speculation",
                ],
                mannerisms: [
                    "uses technical jargon and references logs",
                    "corrects small inaccuracies",
                    "short, clipped sentences when irritated",
                ],
            },
            {
                id: "s3",
                name: "Ava Patel",
                description: "New to process; assisted with formatting exports.",
                age: 22,
                occupation: "Finance Intern",
                image: "/assets/suspects/3.png",
                gender: "F",
                traits: [
                    "nervous but earnest",
                    "eager to please",
                    "admits uncertainty rather than risk being wrong",
                ],
                mannerisms: [
                    "uses filler like 'um' and 'I think'",
                    "apologizes when challenged",
                    "asks if they understood the question correctly",
                ]
            },
        ],
    },
];

export const getCases = (): CaseFile[] => cases;

export const getCaseById = (id: string): CaseFile | undefined =>
    cases.find((c) => c.id === id);
