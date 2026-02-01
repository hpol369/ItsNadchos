import type { Metadata } from "next";
import { Quicksand, Fredoka } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "ItsNadchos | Confident. Playful. Yours.",
  description: "The official hub for ItsNadchos. Watch streams, join the community, and hang out.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${fredoka.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
