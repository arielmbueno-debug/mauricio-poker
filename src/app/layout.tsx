import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Poker Decisions",
  description: "Dashboard de decisões para grinders de torneios online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-bg-base text-fg-primary antialiased">
        <TRPCProvider>
          <AppShell>{children}</AppShell>
        </TRPCProvider>
      </body>
    </html>
  );
}
