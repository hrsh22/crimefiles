"use client";
import Link from "next/link";
// import { getCases } from "./cases";
// import Image from "next/image";
import Wallet from "../wallet";
import { useAccount } from 'wagmi';

export default function CaseFilesIndexPage() {
    // const cases = getCases();
    const { isConnected } = useAccount();

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
                <Link href="/case-files/1" className="absolute bottom-10 right-10 z-20 cursor-pointer text-white px-4 py-2 rounded-md text-3xl font-funnel-display">
                    _ Open Case File _
                </Link>
                {/* <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-8">

                        {/* {cases.map((c, idx) => (
                            <Link key={c.id} href={`/case-files/${c.id}`} className="group block">
                                <section className="relative flex flex-col items-center justify-center w-full h-64">
                                    <div className="relative w-60 h-40 cursor-pointer origin-bottom [perspective:1500px] z-50">
                                        <div className="bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]"></div>
                                        <div className="absolute inset-1 bg-zinc-400 rounded-2xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]"></div>
                                        <div className="absolute inset-1 bg-zinc-300 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]"></div>
                                        <div className="absolute inset-1 bg-zinc-200 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]"></div>
                                        <div className="absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[156px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[146px] after:h-[16px] after:bg-amber-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[10px] before:right-[142px] before:size-3 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);] transition-all ease duration-300 origin-bottom flex items-end group-hover:shadow-[inset_0_20px_40px_#fbbf24,_inset_0_-20px_40px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]"></div>
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

                </div> */}
            </div>
        );
    }

}
