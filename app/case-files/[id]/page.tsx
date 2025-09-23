"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCaseById } from "../cases";
import type { CaseFile } from "../cases";
import Wallet from "@/app/wallet";
import { useAccount } from 'wagmi';

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params as Promise<{ id: string }>);
    const [cidCase, setCidCase] = useState<CaseFile | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const caseFile = useMemo(() => {
        return getCaseById(id) ?? cidCase;
    }, [id, cidCase]);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                const url = `https://gateway.lighthouse.storage/ipfs/${id}`;
                const res = await fetch(url);
                const json = await res.json();
                if (json && typeof json === "object") {
                    const normalizedSuspects = (Array.isArray(json.suspects) ? json.suspects : []).map((s: Partial<CaseFile["suspects"][number]>, i: number) => ({
                        id: s?.id ?? `s${i + 1}`,
                        name: s?.name ?? `Suspect ${i + 1}`,
                        description: s?.description ?? undefined,
                        age: s?.age ?? 22 + i,
                        occupation: s?.occupation ?? "Unknown",
                        image: s?.image ?? `/assets/suspects/${((i % 3) + 1)}.png`,
                        gender: s?.gender ?? "M",
                        traits: s?.traits ?? [],
                        mannerisms: s?.mannerisms ?? [],
                    }));
                    const normalized: CaseFile = {
                        id: (json as Partial<CaseFile>)?.id ?? id,
                        title: (json as Partial<CaseFile>)?.title ?? "Generated Case",
                        excerpt: (json as Partial<CaseFile>)?.excerpt ?? "",
                        story: (json as Partial<CaseFile>)?.story ?? "",
                        hints: Array.isArray((json as Partial<CaseFile>)?.hints) ? ((json as Partial<CaseFile>)?.hints as string[]) : [],
                        suspects: normalizedSuspects,
                    };
                    setCidCase(normalized);
                }
            } catch { }
            finally { setIsLoading(false); }
        })();
    }, [id]);
    const [selectedSuspectId, setSelectedSuspectId] = useState<string>("");
    const { isConnected } = useAccount();
    // const { data: walletClient } = useWalletClient();
    // const [submitted, setSubmitted] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<number>(1);
    const [currentSuspectIndex, setCurrentSuspectIndex] = useState<number>(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);
    const [isInterrogationOpen, setIsInterrogationOpen] = useState<boolean>(false);
    const [chatInput, setChatInput] = useState<string>("");
    const [messages, setMessages] = useState<Array<{ sender: "you" | "suspect"; text: string }>>([]);
    const [isSending, setIsSending] = useState<boolean>(false);

    const TabNames = ["Case File", "Hints", "Suspects", "My Verdict"];

    const selectedSuspect = useMemo(() => {
        if (!caseFile) return undefined;
        return caseFile.suspects.find((s) => s.id === selectedSuspectId);
    }, [caseFile, selectedSuspectId]);

    const handlePrev = () => {
        if (!caseFile) return;
        setCurrentSuspectIndex((prev) => (prev - 1 + caseFile.suspects.length) % caseFile.suspects.length);
    };

    const handleNext = () => {
        if (!caseFile) return;
        setCurrentSuspectIndex((prev) => (prev + 1) % caseFile.suspects.length);
    };

    const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchEndX(null);
    };

    const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (touchStartX === null || touchEndX === null) return;
        const distance = touchStartX - touchEndX;
        const minSwipeDistance = 50;
        if (distance > minSwipeDistance) {
            handleNext();
        } else if (distance < -minSwipeDistance) {
            handlePrev();
        }
        setTouchStartX(null);
        setTouchEndX(null);
    };

    const openInterrogation = async (suspectId: string) => {
        setSelectedSuspectId(suspectId);
        setIsInterrogationOpen(true);
        setChatInput("");
        setMessages([
            { sender: "suspect", text: "You think I did it? Ask your questions." }
        ]);
    };

    const closeInterrogation = () => {
        setIsInterrogationOpen(false);
    };

    const handleSendMessage = async () => {
        const trimmed = chatInput.trim();
        if (!trimmed || !selectedSuspectId || isSending) return;

        // Add user message to the chat
        const userMsg = { sender: "you" as const, text: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setChatInput("");

        // Convert messages to API format (role: user/assistant)
        const apiMessages = messages.map(msg => ({
            role: msg.sender === "you" ? "user" as const : "assistant" as const,
            content: msg.text
        }));

        // Add the current user message
        apiMessages.push({ role: "user", content: trimmed });

        try {
            setIsSending(true);
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    caseId: id,
                    suspectId: selectedSuspectId,
                    messages: apiMessages,
                    case: caseFile
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error("Chat API error:", data.error);
                setMessages((prev) => [...prev, {
                    sender: "suspect",
                    text: "I have nothing to say right now."
                }]);
            } else if (data.response) {
                setMessages((prev) => [...prev, {
                    sender: "suspect",
                    text: data.response
                }]);
            }
        } catch (error) {
            console.error("Failed to get response:", error);
            setMessages((prev) => [...prev, {
                sender: "suspect",
                text: "I need a moment to think..."
            }]);
        } finally {
            setIsSending(false);
        }
    };

    if (!isConnected) {
        return (
            <Wallet />
        );
    }

    console.log(id);

    if (isLoading) {
        return (
            <div className="min-h-screen grid place-items-center bg-gradient-to-b from-[#0b0c10] via-[#121418] to-[#0b0c10] text-zinc-100">
                <div className="max-w-xl w-full px-6 py-10 bg-[#121417] border border-zinc-700/60">
                    <h1 className="text-2xl font-funnel-display">Loading case…</h1>
                </div>
            </div>
        );
    }

    if (!caseFile) {
        return (
            <div className="min-h-screen grid place-items-center bg-gradient-to-b from-[#0b0c10] via-[#121418] to-[#0b0c10] text-zinc-100">
                <div className="max-w-xl w-full px-6 py-10 bg-[#121417] border border-zinc-700/60">
                    <h1 className="text-2xl font-funnel-display">Case not found</h1>
                    <p className="text-zinc-400 mt-2">The case you&apos;re looking for doesn&apos;t exist or couldn&apos;t be fetched.</p>
                    <div className="mt-6">
                        <Link href="/case-files" className="inline-block border border-amber-400/60 text-amber-300 px-4 py-2">
                            ← Back to all cases
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full min-h-screen text-white bg-case-pattern bg-cover bg-center">
            <div className="flex min-h-screen flex-col">
                {/* Left vertical tabs */}
                <div className="text-2xl font-funnel-display text-white p-4">CRIME FILES</div>
                <aside className="w-56 p-4 space-y-2">
                    {[1, 2, 3, 4].map((n) => (
                        <button
                            key={n}
                            onClick={() => setActiveTab(n)}
                            className={`${activeTab === n ? "font-bold font-funnel-display text-3xl" : "font-funnel-display text-3xl text-zinc-300"} w-full text-left px-4 py-3 transition-colors`}
                        >
                            {`${TabNames[n - 1]}`}
                        </button>
                    ))}
                </aside>

                {/* Right content area */}
                <section className="flex-1 left-1/3 fixed">
                    {activeTab === 1 && (
                        <div className="h-screen">
                            <div className="p-8 fixed bottom-5">
                                <h1 className="text-[#2b2f6a] text-6xl font-funnel-display mb-4">{caseFile.title}</h1>
                                <p className="mt-2 text-[#2b2f6a] font-funnel-display mb-8">{caseFile.excerpt}</p>
                                <div className="mt-6">
                                    <div className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4">Case File</div>
                                    <p className="mt-2 leading-7 text-[#2b2f6a] font-funnel-display w-[750px]">{caseFile.story}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="py-10 text-[#2b2f6a]">
                            <div className="mt-6">
                                <div className="p-8 fixed bottom-5">
                                    <h1 className="text-[#2b2f6a] text-6xl font-funnel-display mb-4">{caseFile.title}</h1>
                                    <p className="mt-2 text-[#2b2f6a] font-funnel-display mb-8">{caseFile.excerpt}</p>
                                    <ul className="mt-3 space-y-2">
                                        <div className="text-[11px] uppercase tracking-widest text-zinc-400 py-4">Hints</div>
                                        {caseFile.hints.map((hint, idx) => (
                                            <li key={idx} className="flex gap-2 text-[#2b2f6a] font-funnel-display">
                                                <Image src="/assets/background/hintIcon.png" alt="hint" width={22} height={20} />
                                                <span>{hint}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <>
                            <div
                                className="fixed right-5">
                                <Image className="rounded-full mt-16" src={caseFile.suspects[currentSuspectIndex]?.image || "/suspect.png"} alt="suspect" width={450} height={450} />
                            </div>
                            <div className="fixed bottom-5">
                                <div className="relative select-none flex flex-col justify-center items-center">
                                    <div
                                        className="overflow-hidden"
                                        onTouchStart={onTouchStart}
                                        onTouchMove={onTouchMove}
                                        onTouchEnd={onTouchEnd}
                                    >
                                        <div
                                            className="flex transition-transform duration-300 ease-out"
                                            style={{ transform: `translateX(-${currentSuspectIndex * 100}%)` }}
                                        >
                                            {caseFile.suspects.map((suspect) => (
                                                <div key={suspect.id} className="min-w-full ">
                                                    <div className="min-h-[70vh] md:min-h-[72vh] grid items-stretch px-6 md:px-20 text-[#1e2a42] ">
                                                        <div className="grid md:grid-cols-3 gap-6 w-full ">
                                                            <div className="md:col-span-3 self-center w-full">

                                                                <div className="mt-36">
                                                                    <div className="text-6xl md:text-6xl font-funnel-display text-[#2b2f6a]">
                                                                        {suspect.name}
                                                                    </div>
                                                                </div>
                                                                {suspect.description && (
                                                                    <p className="text-2xl leading-snug font-funnel-display py-4 w-1/2 min-h-[100px]">
                                                                        {suspect.description}
                                                                    </p>
                                                                )}
                                                                <div className="mt-8">
                                                                    <div className="grid grid-cols-4 justify-center items-center">
                                                                        <div>
                                                                            <div className="text-[12px] tracking-[0.3em] uppercase text-[#6a7190]">Occupation</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[12px] tracking-[0.3em] uppercase text-[#6a7190]">Age</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[12px] tracking-[0.3em] uppercase text-[#6a7190]">Gender</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2 border-t-2 border-dashed border-[#2b2f6a]" />
                                                                    <div className="mt-4 grid grid-cols-4">
                                                                        <div className="text-2xl font-funnel-display text-[#2b2f6a]">{suspect.occupation}</div>
                                                                        <div className="text-2xl font-funnel-display text-[#2b2f6a]">{suspect.age}</div>
                                                                        <div className="text-2xl font-funnel-display text-[#2b2f6a]">{suspect.gender}</div>
                                                                        <div onClick={() => openInterrogation(suspect.id)} className="cursor-pointer text-2xl font-funnel-display text-[#2b2f6a]"> _Interrogate_</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {caseFile.suspects.length > 1 && (
                                        <>
                                            <button
                                                aria-label="Previous suspect"
                                                onClick={handlePrev}
                                                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center text-[#2b2f6a]"
                                            >
                                                ‹
                                            </button>
                                            <button
                                                aria-label="Next suspect"
                                                onClick={handleNext}
                                                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center text-[#2b2f6a]"
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}

                                    {caseFile.suspects.length > 1 && (
                                        <div className="mt-3 flex justify-center gap-2">
                                            {caseFile.suspects.map((_, i) => (
                                                <span key={i} className={`h-1.5 w-6 ${i === currentSuspectIndex ? "bg-[#2b2f6a]" : "bg-zinc-400"}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>

                    )}

                    {activeTab === 4 && (
                        <>
                            <div className="relative z-20 max-w-7xl mx-auto px-4 py-12 md:py-20">
                                <div className="grid grid-cols-2 gap-6 md:gap-8 pt-8">
                                    {caseFile.suspects.map((c) => (
                                        <div key={c.id}>
                                            <div className="w-[350px] group overflow-hidden rounded-xl bg-case-card-pattern bg-cover bg-center text-gray-50">
                                                <div className="before:duration-700 before:absolute before:w-28 before:h-28 before:bg-transparent before:blur-none before:border-8 before:opacity-50 before:rounded-full before:-left-4 before:-top-12 w-64 h-48  flex flex-col justify-between relative z-10 group-hover:before:top-28 group-hover:before:left-44 group-hover:before:scale-125 group-hover:before:blur">
                                                    <div className="text p-3 flex flex-col justify-evenly h-full">
                                                        <span className="font-bold text-2xl">{c.name}</span>
                                                    </div>
                                                    <div className="w-[350px] flex flex-row justify-between z-10">
                                                        <div className="hover:opacity-90 py-3 bg-cyan-50 w-full flex justify-center">

                                                        </div>
                                                        <div className="hover:opacity-90 py-3 bg-cyan-50 w-full flex justify-end p-4">
                                                            <Link href={`/case-files/${c.id}`} className="group block text-black ">
                                                                _MARK CRIMINAL_
                                                            </Link>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>

                    )}

                </section>
                {isInterrogationOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-white text-[#1e2a42] border border-[#2b2f6a] shadow-xl">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2f6a]/30">
                                <div className="font-funnel-display text-xl text-[#2b2f6a]">
                                    {selectedSuspect?.name ? `Interrogating ${selectedSuspect.name}` : "Interrogation"}
                                </div>
                                <button
                                    onClick={closeInterrogation}
                                    aria-label="Close interrogation"
                                    className="text-[#2b2f6a] hover:opacity-80"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="h-80 md:h-96 overflow-y-auto px-4 py-3 space-y-3 bg-white">
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.sender === "you" ? "justify-end" : "justify-start"}`}>
                                        <div className={`${m.sender === "you" ? "bg-[#2b2f6a] text-white" : "bg-zinc-100 text-[#1e2a42]"} px-3 py-2 rounded-md max-w-[80%]`}>
                                            <div className="text-xs opacity-70 mb-0.5">{m.sender === "you" ? "You" : selectedSuspect?.name || "Suspect"}</div>
                                            <div className="font-funnel-display">{m.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#2b2f6a]/30 bg-white">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !isSending) handleSendMessage(); }}
                                    placeholder="Ask a question..."
                                    className="flex-1 border border-[#2b2f6a]/40 px-3 py-2 outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isSending}
                                    className={`h-10 px-4 border border-[#2b2f6a] text-[#2b2f6a] ${(!chatInput.trim() || isSending) ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2b2f6a]/10"}`}
                                >
                                    {isSending ? "Sending..." : "Send"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
