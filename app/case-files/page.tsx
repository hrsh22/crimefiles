"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCases } from "./cases";
import Image from "next/image";
import Wallet from "../wallet";
import { useAccount, useWalletClient } from 'wagmi';
import { type GeneratedCaseSeed } from "@/lib/case-seeds";
import { setLatestGeneratedCase } from "@/lib/generated-store";
import { useRouter } from "next/navigation";
import { useConfig, useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/app/config";
import { CASE_FILES_CONTRACT_ADDRESS, CASE_FILES_CONTRACT_ABI } from "@/contracts/contract";
import { Randomness } from "randomness-js";
import { ethers, getBytes } from "ethers";
import { waitForTransactionReceipt } from "@wagmi/core";
import { generateCaseSeedFromRandomBytes } from "@/lib/case-seeds";
import { Blocklock, encodeCiphertextToSolidity, encodeCondition } from "blocklock-js";


export default function CaseFilesIndexPage() {
    const cases = getCases();
    const { isConnected } = useAccount();
    const router = useRouter();
    const [blockClicks, setBlockClicks] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generated, setGenerated] = useState<GeneratedCaseSeed | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isGeneratingSeed, setIsGeneratingSeed] = useState(false);
    const [isEncrypting, setIsEncrypting] = useState(false);

    const { refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "randomness",
    }) as { data: bigint | undefined; refetch: () => Promise<{ data: unknown }> };

    const { writeContract } = useWriteContract();
    const config = useConfig();

    const { data: walletClient } = useWalletClient();

    const handleEncrypt = async (caseCID: string, guiltySuspectId?: string, crimestory?: string) => {
        console.log(crimestory);
        if (!walletClient) {
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(walletClient.transport);
            const jsonProvider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`);
            const signer = await provider.getSigner();
            console.log(signer);
            const contract = new ethers.Contract(CASE_FILES_CONTRACT_ADDRESS, CASE_FILES_CONTRACT_ABI, signer);

            // Calculate target block height based on decryption time
            const currentBlock = await provider.getBlockNumber();
            
            const blockHeight = BigInt(30454366);
            console.log(`Current block: ${currentBlock}, Target block: ${blockHeight.toString()}`);

            // Set the message to encrypt
            const msgBytes = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [JSON.stringify(guiltySuspectId)]);
            const encodedMessage = getBytes(msgBytes);
            console.log("Encoded message:", encodedMessage);

            // Encrypt the encoded message usng Blocklock.js library
            const blocklockjs = Blocklock.createBaseSepolia(jsonProvider);
            const cipherMessage = blocklockjs.encrypt(encodedMessage, blockHeight);
            console.log("Ciphertext:", cipherMessage);
            // Set the callback gas limit and price
            // Best practice is to estimate the callback gas limit e.g., by extracting gas reports from Solidity tests
            const callbackGasLimit = 700_000;
            // Based on the callbackGasLimit, we can estimate the request price by calling BlocklockSender
            // Note: Add a buffer to the estimated request price to cover for fluctuating gas prices between blocks
            console.log(BigInt(callbackGasLimit));
            const [requestCallBackPrice] = await blocklockjs.calculateRequestPriceNative(BigInt(callbackGasLimit))
            console.log("Request CallBack price:", ethers.formatEther(requestCallBackPrice), "ETH");
            const conditionBytes = encodeCondition(blockHeight);

            const tx = await contract.createCase(
                caseCID,
                callbackGasLimit,
                currentBlock,
                blockHeight,
                conditionBytes,
                encodeCiphertextToSolidity(cipherMessage),
                { value: requestCallBackPrice }
            );

            const receipt = await tx.wait(1);
            if (!receipt) throw new Error("Transaction has not been mined");
            router.push(`/case-files/${caseCID}`);
            setIsModalOpen(false);

        } catch (error) {
            console.error('Contract write failed:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
        }
    };

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
            <div className="w-full min-h-screen text-white bg-files-pattern bg-cover bg-center">

                <div className="absolute top-0 left-0 text-2xl font-funnel-display text-white p-4 z-30">CRIME FILES</div>

                {blockClicks && <div className="fixed inset-0 z-40" />}
                {/* Create New Case button */}
                <button onClick={() => { setGenerated(null); setIsModalOpen(true); }} className="fixed bottom-10 right-10 z-30 text-white bg-files-pattern px-4 py-2 font-funnel-display text-xl">
                    _ Create New Case _
                </button>
                <div className="relative z-20 max-w-7xl mx-auto px-4 py-12 md:py-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-8">
                        {cases.map((c) => (
                            <div key={c.id}>
                                <div className="w-[350px] group overflow-hidden rounded-xl bg-case-card-pattern bg-cover bg-center text-gray-50">
                                    <div className="before:duration-700 before:absolute before:w-28 before:h-28 before:bg-transparent before:blur-none before:border-8 before:opacity-50 before:rounded-full before:-left-4 before:-top-12 w-64 h-48  flex flex-col justify-between relative z-10 group-hover:before:top-28 group-hover:before:left-44 group-hover:before:scale-125 group-hover:before:blur">
                                        <div className="text p-3 flex flex-col justify-evenly h-full">
                                            <span className="font-bold text-2xl">{c.title}</span>
                                            <p className="subtitle">{c.hints.length} hints • {c.suspects.length} suspects</p>
                                        </div>
                                        <div className="w-[350px] flex flex-row justify-between z-10">
                                            <div className="hover:opacity-90 py-3 bg-cyan-50 w-full flex justify-center">

                                            </div>
                                            <div className="hover:opacity-90 py-3 bg-cyan-50 w-full flex justify-end p-4">
                                                <Link href={`/case-files/${c.id}`} className="group block ">
                                                    <Image src="/assets/button.png" alt="view" width={24} height={24} />
                                                </Link>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl relative overflow-hidden text-white bg-case-card-pattern bg-cover bg-center border border-[#2b2f6a] shadow-xl">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-black/20">
                                <div className="font-funnel-display text-2xl">Create New Case</div>
                                <button onClick={() => setIsModalOpen(false)} className="text-white hover:opacity-80">✕</button>
                            </div>
                            <div className="px-4 py-4 space-y-4">
                                <div className="min-h-[220px] grid place-items-center">
                                    <div className="font-funnel-display text-center text-white/90 text-lg">
                                        {isEncrypting
                                            ? "Encrypting the criminal and then nav to the casefiles page"
                                            : isGeneratingSeed
                                                ? "Generating a random case with all traits of suspects randomly generated."
                                                : generated
                                                    ? "Case is generated, create case file."
                                                    : "Generate a random case powered by Randamu VRF"}
                                    </div>
                                </div>
                                {generated && (
                                    <div className="border border-white/30 bg-white/90 p-3 text-sm max-h-80 overflow-y-auto text-[#1e2a42]">
                                        <div className="text-[11px] uppercase tracking-widest text-[#6a7190] mb-1">Preview</div>
                                        <pre className="whitespace-pre-wrap break-words text-[#2b2f6a]">{JSON.stringify(generated, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 border-t border-white/20 bg-black/20 flex justify-end gap-2">
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
                                    className={`border border-white/60 text-white px-4 py-2 font-funnel-display hover:bg-white/10 transition-colors ${isGeneratingSeed ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isGeneratingSeed ? "Generating..." : "Generate Case"}
                                </button>
                                <button
                                    disabled={!generated || isGeneratingSeed || isCreating}
                                    onClick={async () => {
                                        if (!generated) return;
                                        try {
                                            setIsEncrypting(true);
                                            setIsCreating(true);
                                            const res = await fetch("/api/case", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ seed: generated }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok || !data.case) throw new Error(data.error || "Failed");
                                            setLatestGeneratedCase(data.case);
                                            
                                            setGenerated(null);
                                            await handleEncrypt(data.case.id as string, data.guiltySuspectId as (string | undefined), data.crimestory as (string | undefined));
                                        } catch (e) {
                                            console.error(e);
                                            setIsEncrypting(false);
                                        } finally {
                                            setIsCreating(false);
                                        }
                                    }}
                                    className={`border border-white/60 text-white px-4 py-2 font-funnel-display hover:bg-white/10 transition-colors ${(!generated || isCreating || isGeneratingSeed) ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isCreating ? "Launching..." : "Launch Case"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

}
