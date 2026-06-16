import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import RouteGuard from "@/components/RouteGuard";
import { ModeProvider } from "@/context/ModeContext";
import ScrollProvider from "@/components/ScrollProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Animeverse - Anime Index & Story Breakdown",
  description: "A premium personal anime index, watch list organizer, episode breakdown, and news system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ModeProvider>
          <ScrollProvider>
            <Navbar />
            <RouteGuard>
              <main className="flex-1 w-full">
                {children}
              </main>
            </RouteGuard>
          </ScrollProvider>
        </ModeProvider>
        <footer className="border-t border-border bg-slate-950/40 py-6 text-center text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} ANIMEVERSE. Created with premium aesthetics. Powered by Jikan API.</p>
        </footer>
      </body>
    </html>
  );
}


