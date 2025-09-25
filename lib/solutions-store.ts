// Ephemeral in-memory store mapping caseId -> solution and metadata
// Not persisted across restarts.

export type CaseSolution = {
    caseId: string;
    guiltySuspectId: string;
    createdAtMs: number;
};

const solutions = new Map<string, CaseSolution>();

export function setCaseSolution(caseId: string, guiltySuspectId: string) {
    solutions.set(caseId, { caseId, guiltySuspectId, createdAtMs: Date.now() });
}

export function getCaseSolution(caseId: string): CaseSolution | undefined {
    return solutions.get(caseId);
}


