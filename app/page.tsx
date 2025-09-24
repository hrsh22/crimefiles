import Link from "next/link";
export default function Home() {
  return (
    <main className="relative text-zinc-100">
      <section className="relative h-[calc(100vh-4rem)] overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/assets/background/home.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-3xl">
            <h1 className="font-funnel-display text-5xl md:text-6xl leading-tight">Enter the CrimeFiles</h1>
            <p className="mt-4 text-white/80 font-funnel-display text-lg">
              Step into the role of a lead detective. Inspect the files, interrogate suspects, and uncover the truth.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Link href="/case-files" className="border border-white/60 hover:border-white px-5 py-2 font-funnel-display">
                Inspect the Files
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
