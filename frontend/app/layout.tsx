import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Web3Providers } from "./providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monad AI Agent Guard",
  description: "On-chain budget circuit breaker for AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-zinc-950 text-zinc-50 antialiased`}>
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  );
}