// Ephemeral in-memory store for accuse deposits.
// NOTE: This data will reset on server restart. For production, replace with a DB.

export type DepositStatus = "pending" | "confirmed" | "failed";

export type DepositIntent = {
    id: string;
    caseId: string;
    suspectId: string;
    fromNearAccountId: string;
    toNearAccountId: string;
    amount: string; // NEAR decimal string (e.g., "0.1")
    amountSmallest: string; // smallest unit (integer string)
    agentPath: string;
    createdAtMs: number;
    updatedAtMs: number;
    status: DepositStatus;
    matchedTxHash?: string;
};

const deposits: DepositIntent[] = [];

export function addDeposit(intent: Omit<DepositIntent, "createdAtMs" | "updatedAtMs" | "status">): DepositIntent {
    const record: DepositIntent = {
        ...intent,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
        status: "pending",
    };
    deposits.push(record);
    return record;
}

export function listDeposits(): DepositIntent[] {
    return deposits.slice();
}

export function getDepositById(id: string): DepositIntent | undefined {
    return deposits.find((d) => d.id === id);
}

export function listDepositsByCase(caseId: string): DepositIntent[] {
    return deposits.filter((d) => d.caseId === caseId);
}

export function updateDepositStatus(id: string, status: DepositStatus, matchedTxHash?: string) {
    const d = getDepositById(id);
    if (d) {
        d.status = status;
        d.updatedAtMs = Date.now();
        if (matchedTxHash) d.matchedTxHash = matchedTxHash;
    }
}

export function getPendingDeposits(): DepositIntent[] {
    return deposits.filter((d) => d.status === "pending");
}

export function getConfirmedDepositsByCase(caseId: string): DepositIntent[] {
    return deposits.filter((d) => d.caseId === caseId && d.status === "confirmed");
}


