"use client"
import Image from "next/image";
import Link from 'next/link'

const Header = () => {

  return (
    <div className="fixed top-0 w-full h-16 flex items-center z-50 bg-black/40 backdrop-blur border-b border-white/10">
      <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            className="cursor-pointer"
            src="/assets/logo.svg"
            width={28}
            height={28}
            alt="CrimeFiles Logo"
          />
          <span className="font-funnel-display tracking-wider text-white/90">CrimeFiles</span>
        </Link>
        <nav className="flex items-center gap-6">
          <a href="https://github.com/hrsh22/crimefiles" target="_blank" className="text-sm font-funnel-display text-white/80 hover:text-white transition-colors">GitHub</a>
        </nav>
      </div>
    </div >
  );
};

export default Header;

