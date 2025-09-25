import { getPendingDeposits, updateDepositStatus } from "@/lib/deposits-store";
import { fetchRecentTransfersToAccount } from "@/lib/near-indexer";

let started = false;

export function startDepositsPoller() {
    if (started) return;
    started = true;
    const intervalMs = 30_000; // 30s
    setInterval(async () => {
        try {
            const pending = getPendingDeposits();
            if (!pending.length) return;
            const sinceMs = Date.now() - 10 * 60 * 1000; // 10 minutes window
            for (const p of pending) {
                try {
                    const transfers = await fetchRecentTransfersToAccount(p.toNearAccountId, sinceMs);
                    const matched = transfers.find(
                        (t) => t.to === p.toNearAccountId && t.amountSmallest === p.amountSmallest && t.from === p.fromNearAccountId,
                    );
                    if (matched) {
                        updateDepositStatus(p.id, "confirmed", matched.txHash);
                    }
                } catch {
                    // ignore individual errors
                }
            }
        } catch {
            // ignore
        }
    }, intervalMs);
}


