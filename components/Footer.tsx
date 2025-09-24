import Image from "next/image";

export default function Footer() {
  return (
    <footer className="text-white py-10 border-t border-white/10 bg-black/50">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image
            className="cursor-pointer"
            src="/assets/logo.svg"
            width={28}
            height={28}
            alt="CrimeFiles Logo"
          />
          <p className="font-funnel-display text-white/80">CrimeFiles</p>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/"
            target="_blank"
            className="text-white/60 hover:text-white transition-colors font-funnel-display text-sm"
          >
            GitHub
          </a>
          <a
            href="https://x.com/"
            target="_blank"
            className="text-white/60 hover:text-white transition-colors font-funnel-display text-sm"
          >
            X
          </a>
        </div>
      </div>
      <div className="mt-6 text-center text-white/40 text-sm">© {new Date().getFullYear()} CrimeFiles. All rights reserved.</div>
    </footer>
  );
}
