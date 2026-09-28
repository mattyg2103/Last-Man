import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Football Eliminator: Last Man Standing",
  description: "Play and manage Last Man Standing football competitions online.",
};

export const viewport: Viewport = {
  themeColor: "#070b17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <Nav />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-white/5 text-center text-xs text-slate-500 py-6">
            Football Eliminator: Last Man Standing — payments are handled outside this website.
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
