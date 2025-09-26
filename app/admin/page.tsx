"use client";
import React, { useState } from "react";

export default function AdminPage() {
    const [caseId, setCaseId] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<unknown>(null);

    const triggerRevealAndDistribute = async () => {
        if (!caseId) return;
        try {
            setLoading(true);
            // Frontend-only demo payload
            const demo = {
                caseId,
                guiltySuspectId: "s3",
                winners: [{ user: "demo", amount: "0.1" }],
                note: "Demo-only: no blockchain or NEAR involved",
            };
            await new Promise((r) => setTimeout(r, 400));
            setResult(demo);
        } catch (e) {
            setResult({ error: (e as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-black text-white p-6">
            <div className="max-w-2xl mx-auto border border-white/10 p-6 bg-white/5">
                <h1 className="text-3xl font-funnel-display mb-4">Admin: Reveal & Distribute</h1>
                <p className="text-white/70 mb-4">Enter the case CID to reveal the answer and distribute the pool to winners.</p>
                <div className="flex gap-2 items-center">
                    <input
                        value={caseId}
                        onChange={(e) => setCaseId(e.target.value)}
                        placeholder="Case CID"
                        className="flex-1 border border-white/20 px-3 py-2 bg-transparent"
                    />
                    <button
                        onClick={triggerRevealAndDistribute}
                        disabled={!caseId || loading}
                        className="border border-white/40 px-4 py-2 hover:bg-white/10 disabled:opacity-50"
                    >
                        {loading ? "Processing…" : "Reveal & Distribute"}
                    </button>
                </div>

                <div className="mt-6">
                    <div className="text-white/70 text-sm mb-2">Result</div>
                    <pre className="text-xs whitespace-pre-wrap break-all border border-white/10 p-3 bg-black/40">
                        {result ? JSON.stringify(result, null, 2) : "—"}
                    </pre>
                </div>
            </div>
        </main>
    );
}


