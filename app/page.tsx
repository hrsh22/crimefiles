import Link from "next/link";
export default function Home() {
  return (
    <main className="bg-home-pattern text-zinc-100">
      <section className="relative h-screen overflow-hidden">
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div>
            <div className="font-funnel-display text-xl fixed bottom-20 right-50">
              <Link href="/case-files">_ INSPECT THE FILES _</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
