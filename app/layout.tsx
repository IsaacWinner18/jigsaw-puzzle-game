import type { Metadata } from "next";
import Script from "next/script";
import { Anton, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jigsaw Atelier - Classic Puzzle Game",
  description:
    "Tactile jigsaw puzzle campaign with mathematical interlocking tab/blank pieces, adaptive difficulty, procedural artwork, and smooth snap-to-grid mechanics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} ${poppins.variable} dark antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <Script
          src="https://passizy.com/sdk/v1/passizy.js"
          strategy="beforeInteractive"
        />
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
