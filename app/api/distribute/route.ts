import "@/lib/polyfills";
import { NextResponse } from "next/server";
import { getCaseSolution, setCaseSolution } from "@/lib/solutions-store";
import { getConfirmedDepositsByCase, listDeposits } from "@/lib/deposits-store";

export const runtime = "nodejs";

// GET /api/distribute?caseId=cid
// Computes winners by matching deposits with guilty suspect and disperses the pool using AgentKit wallet (EVM payout)
// For demo: we simulate payout by returning the computed shares. Hook actual EVM transfers via agentkit when needed.
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const caseId = searchParams.get("caseId");
        if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });

        let solution = getCaseSolution(caseId);
        if (!solution) {
            // Fallback: support the built-in demo case id by deriving the guilty suspect from static data
            try {
                const casesMod = await import("@/app/case-files/cases");
                const maybeCase = casesMod.getCaseById(caseId);
                if (maybeCase) {
                    const accusedObj = (casesMod as unknown as { Accused?: { killer?: string } }).Accused;
                    const killerName: string | undefined = accusedObj?.killer;
                    const byName = killerName ? maybeCase.suspects.find((s) => s.name === killerName)?.id : undefined;
                    const fallback = maybeCase.suspects.find((s) => s.id === "s3")?.id;
                    const guiltyId = byName || fallback;
                    if (guiltyId) {
                        setCaseSolution(caseId, guiltyId);
                        solution = getCaseSolution(caseId);
                    }
                }
            } catch { }
        }
        if (!solution) return NextResponse.json({ error: "No solution available for case" }, { status: 404 });

        const deposits = getConfirmedDepositsByCase(caseId);
        if (!deposits.length) return NextResponse.json({ error: "No confirmed deposits" }, { status: 400 });

        // Winners are those whose suspectId === guiltySuspectId
        const winners = deposits.filter((d) => d.suspectId === solution.guiltySuspectId);
        if (!winners.length) return NextResponse.json({ error: "No winners" }, { status: 400 });

        // Pool is sum of all deposits for this case (confirmed only)
        const totalSmallest = deposits.reduce((acc, d) => (BigInt(acc) + BigInt(d.amountSmallest)).toString(), "0");
        const shareSmallest = (BigInt(totalSmallest) / BigInt(winners.length)).toString();

        // OPTIONAL: perform EVM payouts using AgentKit if mapping from NEAR account -> EVM address is available.
        // For now, just compute a distribution plan.
        const plan = winners.map((w) => ({
            nearAccount: w.fromNearAccountId,
            amount: w.amount,
            amountSmallest: shareSmallest,
        }));

        // Example future hook: using agentkit to send ERC-20 or native on Base Sepolia
        // const { walletProvider } = await prepareAgentkitAndWalletProvider();
        // for (const p of plan) {
        //   await walletProvider.transfer({ to: evmAddressFor(p.nearAccount), value: parseEther("0.001") });
        // }

        return NextResponse.json({
            caseId,
            guiltySuspectId: solution.guiltySuspectId,
            totalAmountSmallest: totalSmallest,
            winners: plan,
            deposits: listDeposits().filter((d) => d.caseId === caseId),
        });
    } catch (e) {
        console.error("distribute GET error", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}


