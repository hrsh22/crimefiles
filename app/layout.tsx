import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Funnel_Display, Funnel_Sans } from "next/font/google";
import "./globals.css";
import { ContextProvider } from ".";
import Header from "@/components/header";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel-display",
  weight: ["300", "400", "500", "600", "700", "800"],
});
const funnelSans = Funnel_Sans({
  subsets: ["latin"],
  variable: "--font-funnel-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Websit Config
export const metadata: Metadata = {
  title: "CrimeFiles",
  description: "Enter the case. Unravel the truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} ${funnelDisplay.variable} ${funnelSans.variable} font-sans`}
      >
        <ContextProvider>
          <Header />
          <div className="pt-16 min-h-screen">
            {children}
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}
