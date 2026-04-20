import type { Metadata } from "next";
import { Anton } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
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
      lang="en"
      data-scroll-behavior="smooth"
      className={`h-full font-sans antialiased ${anton.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
