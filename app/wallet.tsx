import { WalletConnect } from "@/components/walletConnect";
export default function Wallet() {


  return (
    <main className="bg-home-pattern text-zinc-100">
      <section className="relative h-screen overflow-hidden">
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div>
            <div className="font-funnel-display text-xl fixed bottom-20 right-50">
              <WalletConnect />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
