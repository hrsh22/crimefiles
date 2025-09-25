import "@/lib/polyfills";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addDeposit, getPendingDeposits, updateDepositStatus, listDeposits } from "@/lib/deposits-store";
import { fetchRecentTransfersToAccount } from "@/lib/near-indexer";
import { startDepositsPoller } from "@/lib/deposits-poller";

export const runtime = "nodejs";

// Accuse API
// POST body: { caseId: string, suspectId: string, fromNearAccountId: string, amount: string }
// Returns: { id, toNearAccountId, amount }
export async function POST(req: Request) {
    try {
        startDepositsPoller();
        const envContractId = process.env.NEXT_PUBLIC_contractId as string | undefined;
        if (!envContractId) {
            return NextResponse.json({ error: "Missing NEXT_PUBLIC_contractId" }, { status: 500 });
        }

        const body = await req.json().catch(() => null) as {
            caseId?: string;
            suspectId?: string;
            fromNearAccountId?: string;
            amount?: string; // NEAR decimal string like "0.1"
        } | null;
        if (!body || typeof body.caseId !== "string" || typeof body.suspectId !== "string" || typeof body.fromNearAccountId !== "string" || typeof body.amount !== "string") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Convert NEAR decimal to smallest unit string (24 decimals)
        const toSmallest = (amt: string): string => {
            const [whole, frac = ""] = amt.split(".");
            const fracPadded = (frac + "000000000000000000000000").slice(0, 24);
            const normalizedWhole = whole.replace(/^0+(?!$)/, "");
            return `${normalizedWhole}${fracPadded}`;
        };

        const id = randomUUID();
        const record = addDeposit({
            id,
            caseId: body.caseId,
            suspectId: body.suspectId,
            fromNearAccountId: body.fromNearAccountId,
            toNearAccountId: envContractId,
            amount: body.amount,
            amountSmallest: toSmallest(body.amount),
            agentPath: "accuse",
        });

        return NextResponse.json({ id: record.id, toNearAccountId: record.toNearAccountId, amount: record.amount });
    } catch (e) {
        console.error("accuse POST error", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// GET: returns current deposits and triggers a background check for pending ones
export async function GET() {
    try {
        startDepositsPoller();
        // kick a poll without awaiting each; but we await overall to simplify
        const pending = getPendingDeposits();
        const sinceMs = Date.now() - 5 * 60 * 1000; // last 5 minutes
        for (const p of pending) {
            try {
                const transfers = await fetchRecentTransfersToAccount(p.toNearAccountId, sinceMs);
                const matched = transfers.find((t) => t.to === p.toNearAccountId && t.amountSmallest === p.amountSmallest && t.from === p.fromNearAccountId);
                if (matched) {
                    updateDepositStatus(p.id, "confirmed", matched.txHash);
                }
            } catch (err) {
                console.warn("poll check failed", err);
            }
        }
        return NextResponse.json({ deposits: listDeposits() });
    } catch (e) {
        console.error("accuse GET error", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}


