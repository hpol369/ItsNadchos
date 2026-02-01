import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Outfit is perfect for the "streamer" aesthetic
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
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
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
