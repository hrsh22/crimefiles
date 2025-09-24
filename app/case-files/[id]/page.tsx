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
    const [activeTab, setActiveTab] = useState<number>(1);
    const [currentSuspectIndex, setCurrentSuspectIndex] = useState<number>(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);
    const [isInterrogationOpen, setIsInterrogationOpen] = useState<boolean>(false);
    const [chatInput, setChatInput] = useState<string>("");
    const [messages, setMessages] = useState<Array<{ sender: "you" | "suspect"; text: string }>>([]);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isHydrating, setIsHydrating] = useState<boolean>(false);

    // Hints unlocking state (simple: start with 1, increment on unlock)
    const [unlockedHintsCount, setUnlockedHintsCount] = useState<number>(1);

    const TabNames = ["Case File", "Hints", "Suspects", "My Verdict"];

    const selectedSuspect = useMemo(() => {
        if (!caseFile) return undefined;
        return caseFile.suspects.find((s) => s.id === selectedSuspectId);
    }, [caseFile, selectedSuspectId]);

    const visibleHintsCount = useMemo(() => {
        if (!caseFile) return 0;
        return Math.min(unlockedHintsCount, caseFile.hints.length);
    }, [caseFile, unlockedHintsCount]);

    const unlockNextHint = () => {
        if (!caseFile) return;
        setUnlockedHintsCount((prev) => Math.min(prev + 1, caseFile.hints.length));
    };

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
        // Hydrate from localStorage only for smooth UX
        setIsHydrating(true);
        try {
            const msgsKey = `near_thread_msgs_${suspectId}`;
            const raw = typeof window !== 'undefined' ? localStorage.getItem(msgsKey) : null;
            if (raw) {
                try {
                    const parsed = JSON.parse(raw) as Array<{ sender: "you" | "suspect"; text: string }>;
                    if (Array.isArray(parsed)) {
                        setMessages(parsed);
                        setIsHydrating(false);
                        return;
                    }
                } catch { }
            }
        } catch (error) {
            console.error("Failed to load cached thread messages:", error);
        }
        // If no cache, start empty
        setMessages([]);
        setIsHydrating(false);
    };

    const closeInterrogation = () => {
        setIsInterrogationOpen(false);
    };

    const handleSendMessage = async () => {
        const trimmed = chatInput.trim();
        if (!trimmed || !selectedSuspectId || isSending) return;

        // Add user message locally and persist
        const userMsg = { sender: "you" as const, text: trimmed };
        const nextAfterUser = [...messages, userMsg];
        setMessages(nextAfterUser);
        setChatInput("");
        try {
            const msgsKey = `near_thread_msgs_${selectedSuspectId}`;
            localStorage.setItem(msgsKey, JSON.stringify(nextAfterUser));
        } catch { }

        // Send only the latest user message (thread maintains context)
        const latestMessage = { role: "user" as const, content: trimmed };

        try {
            setIsSending(true);
            // Persist thread per suspect in localStorage
            const storageKey = `near_thread_${selectedSuspectId}`;
            let existingThreadId: string | undefined = undefined;
            try {
                existingThreadId = localStorage.getItem(storageKey) || undefined;
            } catch { }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    suspectId: selectedSuspectId,
                    messages: [latestMessage],
                    threadId: existingThreadId,
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
                try {
                    if (data.threadId) {
                        localStorage.setItem(storageKey, data.threadId as string);
                    }
                } catch { }
                const assistantMsg = { sender: "suspect" as const, text: data.response as string };
                const nextAfterAssistant = [...nextAfterUser, assistantMsg];
                setMessages(nextAfterAssistant);
                try {
                    const msgsKey = `near_thread_msgs_${selectedSuspectId}`;
                    localStorage.setItem(msgsKey, JSON.stringify(nextAfterAssistant));
                } catch { }
            }
        } catch (error) {
            console.error("Failed to get response:", error);
            const fallback = { sender: "suspect" as const, text: "I need a moment to think..." };
            const nextWithFallback = [...messages, { sender: "you" as const, text: trimmed }, fallback];
            setMessages(nextWithFallback);
            try {
                const msgsKey = `near_thread_msgs_${selectedSuspectId}`;
                localStorage.setItem(msgsKey, JSON.stringify(nextWithFallback));
            } catch { }
        } finally {
            setIsSending(false);
        }
    };

    if (!isConnected) {
        return (
            <Wallet />
        );
    }

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-b from-[#0b0c10] via-[#0f1218] to-[#0b0c10] text-zinc-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <div className="font-funnel-display text-white/80">Loading case…</div>
                </div>
            </div>
        );
    }

    if (!caseFile) {
        return (
            <div className="h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-b from-[#0b0c10] via-[#0f1218] to-[#0b0c10] text-zinc-100">
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
        <main className="w-full h-[calc(100vh-4rem)] text-white relative overflow-hidden bg-gradient-to-b from-[#0b0c10] via-[#0f1218] to-[#0b0c10]">
            <div className="flex h-full">
                {/* Left vertical tabs */}
                <aside className="w-56 h-full p-6 border-r border-white/10 bg-black/30 backdrop-blur overflow-auto">
                    <div className="font-funnel-display text-sm tracking-widest text-white/60 uppercase mb-4">Dossier</div>
                    {[1, 2, 3, 4].map((n) => (
                        <button
                            key={n}
                            onClick={() => setActiveTab(n)}
                            className={`${activeTab === n ? "text-white" : "text-white/60"} font-funnel-display text-xl w-full text-left px-2 py-2 transition-colors`}
                        >
                            {`${TabNames[n - 1]}`}
                        </button>
                    ))}
                </aside>

                {/* Right content area */}
                <section className="flex-1 h-full overflow-auto">
                    {activeTab === 1 && (
                        <div className="p-10">
                            <h1 className="text-5xl font-funnel-display mb-2">{caseFile.title}</h1>
                            <p className="mt-1 text-white/80 font-funnel-display mb-8">{caseFile.excerpt}</p>
                            <div className="mt-6">
                                <div className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4">Case File</div>
                                <p className="mt-2 leading-7 whitespace-pre-wrap break-words text-white/90 font-funnel-display max-w-3xl">{caseFile.story}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="p-10">
                            <h2 className="text-4xl font-funnel-display mb-2">Hints</h2>
                            <p className="text-white/70 font-funnel-display mb-6">Clues gathered so far</p>
                            <ul className="mt-3 space-y-3">
                                {caseFile.hints.map((hint, idx) => {
                                    const isUnlocked = idx < visibleHintsCount;
                                    return (
                                        <li key={idx} className="flex items-center gap-3 font-funnel-display">
                                            <Image src="/assets/background/hintIcon.png" alt="hint" width={22} height={20} />
                                            {isUnlocked ? (
                                                <span className="text-white/90">{hint}</span>
                                            ) : (
                                                <div className="flex items-center gap-3 text-white/50">
                                                    <span className="select-none">Locked hint</span>
                                                    <button
                                                        onClick={unlockNextHint}
                                                        className="border border-white/30 text-white/80 px-3 py-1 hover:bg-white/10"
                                                    >
                                                        Unlock now
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="mt-4 text-xs text-white/50">
                                {visibleHintsCount}/{caseFile.hints.length} hints unlocked
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div className="p-10">
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
                                                <div className="min-h-[70vh] grid items-stretch px-6 md:px-20">
                                                    <div className="grid md:grid-cols-3 gap-6 w-full">
                                                        <div className="md:col-span-2 self-center">
                                                            <div className="mt-10">
                                                                <div className="text-5xl md:text-6xl font-funnel-display">
                                                                    {suspect.name}
                                                                </div>
                                                            </div>
                                                            {suspect.description && (
                                                                <p className="text-xl leading-snug font-funnel-display py-4 max-w-xl text-white/80">
                                                                    {suspect.description}
                                                                </p>
                                                            )}
                                                            <div className="mt-6">
                                                                <div className="grid grid-cols-4 items-center">
                                                                    <div>
                                                                        <div className="text-[12px] tracking-[0.3em] uppercase text-white/50">Occupation</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[12px] tracking-[0.3em] uppercase text-white/50">Age</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[12px] tracking-[0.3em] uppercase text-white/50">Gender</div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 border-t border-dashed border-white/20" />
                                                                <div className="mt-4 grid grid-cols-4 items-center">
                                                                    <div className="text-2xl font-funnel-display">{suspect.occupation}</div>
                                                                    <div className="text-2xl font-funnel-display">{suspect.age}</div>
                                                                    <div className="text-2xl font-funnel-display">{suspect.gender}</div>
                                                                    <div>
                                                                        <button onClick={() => openInterrogation(suspect.id)} className="border border-white/40 text-white px-3 py-1 hover:bg-white/10 font-funnel-display">
                                                                            Interrogate
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-1 flex md:justify-end order-first md:order-last">
                                                            <Image className="rounded-md mt-6 md:mt-0" src={suspect.image || "/suspect.png"} alt="suspect" width={360} height={360} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {caseFile.suspects.length > 1 && (
                                    <div className="mt-3 flex justify-center gap-2">
                                        {caseFile.suspects.map((_, i) => (
                                            <span key={i} className={`h-1.5 w-6 ${i === currentSuspectIndex ? "bg-white" : "bg-white/40"}`} />
                                        ))}
                                    </div>
                                )}

                                {caseFile.suspects.length > 1 && (
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4">
                                        <button
                                            aria-label="Previous suspect"
                                            onClick={handlePrev}
                                            className="h-10 w-10 grid place-items-center text-white/80 hover:text-white"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            aria-label="Next suspect"
                                            onClick={handleNext}
                                            className="h-10 w-10 grid place-items-center text-white/80 hover:text-white"
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 4 && (
                        <div className="p-10">
                            <h2 className="text-4xl font-funnel-display mb-4">My Verdict</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {caseFile.suspects.map((c) => (
                                    <div key={c.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                        <div className="p-5 flex items-center gap-4">
                                            <Image src={c.image || "/suspect.png"} alt={c.name} width={56} height={56} className="rounded-md" />
                                            <div className="font-funnel-display text-2xl">{c.name}</div>
                                        </div>
                                        <div className="border-t border-white/10 flex items-center justify-end px-4 py-3">
                                            <Link href={`/case-files/${c.id}`} className="font-funnel-display border border-white/40 px-3 py-1 hover:bg-white/10">
                                                Accuse
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </section>

                {isInterrogationOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-black text-white border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                <div className="font-funnel-display text-xl">
                                    {selectedSuspect?.name ? `Interrogating ${selectedSuspect.name}` : "Interrogation"}
                                </div>
                                <button
                                    onClick={closeInterrogation}
                                    aria-label="Close interrogation"
                                    className="text-white/70 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="h-80 md:h-96 overflow-y-auto px-4 py-3 space-y-3 bg-black/60">
                                {isHydrating && (
                                    <div className="text-sm text-white/60">Loading previous messages…</div>
                                )}
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.sender === "you" ? "justify-end" : "justify-start"}`}>
                                        <div className={`${m.sender === "you" ? "bg-white text-black" : "bg-white/10 text-white"} px-3 py-2 rounded-md max-w-[80%]`}>
                                            <div className="text-xs opacity-70 mb-0.5">{m.sender === "you" ? "You" : selectedSuspect?.name || "Suspect"}</div>
                                            <div className="font-funnel-display">{m.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-black/60">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !isSending) handleSendMessage(); }}
                                    placeholder="Ask a question..."
                                    className="flex-1 border border-white/20 px-3 py-2 outline-none bg-transparent placeholder:text-white/50"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isSending}
                                    className={`h-10 px-4 border border-white/40 text-white ${(!chatInput.trim() || isSending) ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"}`}
                                >
                                    {isSending ? "Sending…" : "Send"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
