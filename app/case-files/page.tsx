"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCases } from "./cases";
import Image from "next/image";
import Wallet from "../wallet";
import { useAccount } from 'wagmi';


export default function CaseFilesIndexPage() {
    const cases = getCases();
    const { isConnected } = useAccount();
    const [blockClicks, setBlockClicks] = useState(false);


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
            </div>
        );
    }

}
