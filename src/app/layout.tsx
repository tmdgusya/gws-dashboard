import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import ChatPanel from "@/components/chat/ChatPanel";
import { ChatProvider } from "@/components/chat/ChatContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GWS Workspace Hub",
  description: "Personal productivity dashboard for Google Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950`}
      >
        <ChatProvider>
          <TopNav />
          <div className="flex pt-16 min-h-screen">
            <main className="flex-1 min-w-0">
              {children}
            </main>
            <ChatPanel />
          </div>
        </ChatProvider>
      </body>
    </html>
  );
}
