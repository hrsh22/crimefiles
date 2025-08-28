"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCases } from "./cases";
// import Image from "next/image";
import Wallet from "../wallet";
import { useAccount } from 'wagmi';
import { type GeneratedCaseSeed } from "@/lib/case-seeds";
import { setLatestGeneratedCase } from "@/lib/generated-store";
import { useRouter } from "next/navigation";
import { useConfig, useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/app/config";
import { Randomness } from "randomness-js";
import { ethers, getBytes } from "ethers";
import { waitForTransactionReceipt } from "@wagmi/core";
import { generateCaseSeedFromRandomBytes } from "@/lib/case-seeds";

export default function CaseFilesIndexPage() {
    const cases = getCases();
    const { isConnected } = useAccount();
    const router = useRouter();
    const [blockClicks, setBlockClicks] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generated, setGenerated] = useState<GeneratedCaseSeed | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isGeneratingSeed, setIsGeneratingSeed] = useState(false);

    const { refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "randomness",
    }) as { data: bigint | undefined; refetch: () => Promise<{ data: unknown }> };

    const { writeContract } = useWriteContract();
    const config = useConfig();

    const startPollingForRandomness = () => {
        let attempts = 0;
        const maxAttempts = 90;
        const interval = setInterval(async () => {
            attempts += 1;
            try {
                const result = await refetch();
                const valueBigInt = result?.data as bigint | undefined;
                const value = valueBigInt ? valueBigInt.toString() : "";
                if (value && value !== "0") {
                    const bytes = getBytes(value);
                    const seed = generateCaseSeedFromRandomBytes(bytes);
                    setGenerated(seed);
                    clearInterval(interval);
                    setIsGeneratingSeed(false);
                }
            } catch { }
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                setIsGeneratingSeed(false);
            }
        }, 1000);
    };

    useEffect(() => {
        if (isConnected) {
            setBlockClicks(true);
            const t = setTimeout(() => setBlockClicks(false), 600);
            return () => clearTimeout(t);
        }
        setBlockClicks(false);
    }, [isConnected]);

    if (!isConnected) {
        return <Wallet />;
    }

    else {
        return (
            <div className="w-full min-h-screen text-white">

                <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src="/case-videos/1.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                />

                <div className="fixed left-0 z-10 w-full h-full">
                    <img
                        className="z-10 h-screen"
                        src="/assets/background/caseBg.svg"
                        alt="caseBg"
                    />
                    <div className="absolute top-0 left-0 text-2xl font-funnel-display text-white p-8 z-30">CRIME FILES</div>
                </div>
                {blockClicks && <div className="fixed inset-0 z-40" />}
                {/* Create New Case button */}
                <button onClick={() => { setGenerated(null); setIsModalOpen(true); }} className="fixed bottom-10 right-10 z-30 border border-amber-400/60 text-amber-300 px-4 py-2 font-funnel-display text-xl">
                    _ Create New Case _
                </button>
                <div className="relative z-20 max-w-7xl mx-auto px-4 py-12 md:py-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-8">
                        {cases.map((c, idx) => (
                            <Link key={c.id} href={`/case-files/${c.id}`} className="group block">
                                <section className="relative flex flex-col items-center justify-center w-full h-64">
                                    <div className="relative w-60 h-40 cursor-pointer origin-bottom [perspective:1500px] z-50">
                                        <div className="bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%)]"></div>
                                        <div className="absolute inset-1 bg-zinc-400 rounded-2xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]"></div>
                                        <div className="absolute inset-1 bg-zinc-300 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]"></div>
                                        <div className="absolute inset-1 bg-zinc-200 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]"></div>
                                        <div className="absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[156px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[146px] after:h-[16px] after:bg-amber-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[10px] before:right-[142px] before:size-3 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%)] transition-all ease duration-300 origin-bottom flex items-end group-hover:shadow-[inset_0_20px_40px_#fbbf24,_inset_0_-20px_40px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]"></div>
                                    </div>
                                    <div className="pt-4 text-center">
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Case {String(idx + 1).padStart(3, '0')}</div>
                                        <h2 className="mt-2 font-funnel-display text-lg md:text-xl text-zinc-50">{c.title}</h2>
                                        <p className="mt-1 text-xs text-zinc-400 font-funnel-display">{c.hints.length} hints • {c.suspects.length} suspects</p>
                                    </div>
                                </section>
                            </Link>
                        ))}
                    </div>
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-white text-[#1e2a42] border border-[#2b2f6a] shadow-xl">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2f6a]/30">
                                <div className="font-funnel-display text-xl text-[#2b2f6a]">Create New Case</div>
                                <button onClick={() => setIsModalOpen(false)} className="text-[#2b2f6a]">✕</button>
                            </div>
                            <div className="px-4 py-4 space-y-4 bg-white">
                                <button
                                    onClick={async () => {
                                        try {
                                            setIsGeneratingSeed(true);
                                            const callbackGasLimit = 700_000;
                                            const jsonProvider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`);
                                            const randomness = Randomness.createBaseSepolia(jsonProvider);
                                            const [requestCallBackPrice] = await randomness.calculateRequestPriceNative(BigInt(callbackGasLimit));
                                            writeContract(
                                                {
                                                    address: CONTRACT_ADDRESS,
                                                    abi: CONTRACT_ABI,
                                                    functionName: "generateWithDirectFunding",
                                                    args: [callbackGasLimit],
                                                    value: requestCallBackPrice,
                                                },
                                                {
                                                    onSuccess: async (txHash: string) => {
                                                        try {
                                                            const receipt = await waitForTransactionReceipt(config, { hash: txHash as `0x${string}` });
                                                            if (receipt.status === "success") startPollingForRandomness();
                                                            else setIsGeneratingSeed(false);
                                                        } catch {
                                                            setIsGeneratingSeed(false);
                                                        }
                                                    },
                                                    onError: () => {
                                                        setIsGeneratingSeed(false);
                                                    }
                                                }
                                            );
                                        } catch {
                                            setIsGeneratingSeed(false);
                                        }
                                    }}
                                    className="border border-[#2b2f6a] text-[#2b2f6a] px-4 py-2 font-funnel-display"
                                >
                                    {isGeneratingSeed ? "Generating Seed..." : "Generate AI Case Seed"}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        disabled={!generated}
                                        onClick={async () => {
                                            if (!generated) return;
                                            try {
                                                setIsCreating(true);
                                                const res = await fetch("/api/case", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ seed: generated }),
                                                });
                                                const data = await res.json();
                                                if (!res.ok || !data.case) throw new Error(data.error || "Failed");
                                                setLatestGeneratedCase(data.case);
                                                router.push("/case-files/generated");
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setIsCreating(false);
                                            }
                                        }}
                                        className={`border border-[#2b2f6a] text-[#2b2f6a] px-4 py-2 font-funnel-display ${(!generated || isCreating || isGeneratingSeed) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {isCreating ? "Creating..." : "Create Case"}
                                    </button>
                                </div>
                                {generated && (
                                    <div className="border border-[#2b2f6a]/30 p-3 text-sm max-h-80 overflow-y-auto">
                                        <div className="text-[11px] uppercase tracking-widest text-[#6a7190] mb-1">Preview</div>
                                        <pre className="whitespace-pre-wrap break-words text-[#2b2f6a]">{JSON.stringify(generated, null, 2)}</pre>
                                    </div>
                                )}
                                <div className="text-xs text-[#6a7190]">Next step: we will wire this to an API to generate a full case in cases.ts format.</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

}
