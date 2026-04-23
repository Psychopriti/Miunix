import type { Metadata } from "next";
import { Space_Grotesk, Roboto } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// ── Display / Heading font ────────────────────────────────────────────────────
// Space Grotesk: variable font — covers all weights 300-700 in one request
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// ── Body font ─────────────────────────────────────────────────────────────────
// Roboto: not variable — must enumerate each weight explicitly
const roboto = Roboto({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/brand/miunix-mark.svg",
    shortcut: "/brand/miunix-mark.svg",
    apple: "/brand/miunix-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${spaceGrotesk.variable} ${roboto.variable}`}
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
