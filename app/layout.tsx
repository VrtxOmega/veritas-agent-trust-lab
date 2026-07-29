import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VERITAS Omega Agent Trust Lab — A verdict is not authority",
  description:
    "Make six blinded agent decisions, then watch deterministic assurance checks catch forgery, parameter swaps, replay, correlation, evidence deletion, and stale monitoring.",
  keywords: [
    "AI agent security",
    "agent governance",
    "assurance",
    "VERITAS Omega",
    "AI safety",
  ],
  authors: [{ name: "VrtxOmega", url: "https://github.com/VrtxOmega" }],
  creator: "VrtxOmega",
  openGraph: {
    title: "VERITAS Omega Agent Trust Lab",
    description:
      "Can you tell which AI-agent decision was forged? Take the six-case blind challenge.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VERITAS Omega Agent Trust Lab",
    description: "A verdict is not authority. Take the six-case blind challenge.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${plexMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
