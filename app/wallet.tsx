import { WalletConnect } from "@/components/walletConnect";
export default function Wallet() {


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
          <div>
            <div className="font-funnel-display text-xl">
              <WalletConnect />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
