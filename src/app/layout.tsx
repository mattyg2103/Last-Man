import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Football Eliminator: Last Man Standing",
  description: "Play and manage Last Man Standing football competitions online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <Nav />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
          <footer className="text-center text-xs text-gray-500 py-6">
            Football Eliminator: Last Man Standing — payments are handled outside this website.
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
