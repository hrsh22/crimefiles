// Minimal NEAR indexer client using NearBlocks public API (testnet/mainnet)
// Docs: https://nearblocks.io

export type NearTransfer = {
    txHash: string;
    from: string;
    to: string;
    amountSmallest: string;
    timestampMs: number;
};

type NearBlocksTx = {
    transaction_hash: string;
    signer_account_id: string;
    receiver_account_id: string;
    block_timestamp: number; // nanoseconds
    // ... other fields
};

const TESTNET_BASE = "https://api-testnet.nearblocks.io/v1";
const MAINNET_BASE = "https://api.nearblocks.io/v1";

function getBase(): string {
    const network = process.env.NEAR_NETWORK || "testnet";
    return network === "mainnet" ? MAINNET_BASE : TESTNET_BASE;
}

function nsToMs(ns: number): number {
    return Math.floor(ns / 1_000_000);
}

export async function fetchRecentTransfersToAccount(accountId: string, sinceMs: number): Promise<NearTransfer[]> {
    // NearBlocks does not provide a direct "incoming transfers" endpoint.
    // We approximate by fetching the most recent txs for the account and filtering where it is receiver.
    // Endpoint: /account/{accountId}/txns?limit=50
    const base = getBase();
    const url = `${base}/account/${accountId}/txns?limit=50`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const txs = (json?.txns || []) as NearBlocksTx[];
    const transfers: NearTransfer[] = [];

    for (const tx of txs) {
        const tsMs = nsToMs(tx.block_timestamp);
        if (tsMs < sinceMs) continue;
        // We cannot extract exact NEAR amount from this endpoint without parsing receipts.
        // Use a separate endpoint to get receipts and sum transfer actions.
        const detailed = await fetch(`${base}/txns/${tx.transaction_hash}`).then((r) => r.ok ? r.json() : null).catch(() => null);
        const actions = detailed?.actions || [];
        for (const act of actions) {
            // Transfer action shape varies; attempt to detect a transfer with deposit
            // Example act: { action: 'Transfer', deposit: '1000000000000000000000000', receiver_id: 'to.near' }
            const isTransfer = (act?.action || '').toLowerCase() === 'transfer';
            const deposit = act?.deposit as string | undefined;
            const receiver = act?.receiver_id as string | undefined;
            const signer = detailed?.signer_account_id as string | undefined;
            if (isTransfer && deposit && receiver === accountId) {
                transfers.push({
                    txHash: tx.transaction_hash,
                    from: signer || tx.signer_account_id,
                    to: receiver,
                    amountSmallest: deposit,
                    timestampMs: tsMs,
                });
            }
        }
    }

    return transfers;
}


