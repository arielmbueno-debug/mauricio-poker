"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, ListOrdered, Upload, Settings, Spade } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/decisoes", label: "Decisões", icon: Target },
  { href: "/sessoes", label: "Sessões", icon: ListOrdered },
  { href: "/importar", label: "Importar", icon: Upload },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-bg-panel flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="w-7 h-7 rounded bg-accent/15 flex items-center justify-center">
          <Spade className="w-4 h-4 text-accent" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm tracking-tight">Poker Decisions</span>
          <span className="text-2xs text-fg-muted">v0.1 · local</span>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm transition-colors",
                active
                  ? "bg-bg-elev text-fg-primary border border-border"
                  : "text-fg-secondary hover:bg-bg-hover hover:text-fg-primary border border-transparent",
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="text-2xs text-fg-muted leading-relaxed">
          MTT decision support<br />
          <span className="text-fg-dim">Built with TS strict</span>
        </div>
      </div>
    </aside>
  );
}
