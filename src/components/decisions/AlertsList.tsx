"use client";

import { trpc } from "@/lib/trpc/client";
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  info: Info,
  positive: CheckCircle2,
  warning: AlertCircle,
  danger: AlertTriangle,
} as const;

const COLORS = {
  info: "text-info border-info/30 bg-info-dim/30",
  positive: "text-positive border-positive/30 bg-positive-dim/30",
  warning: "text-warning border-warning/30 bg-warning-dim/30",
  danger: "text-negative border-negative/30 bg-negative-dim/30",
} as const;

export function AlertsList({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = trpc.decisions.alerts.useQuery();
  if (isLoading) {
    return <div className="panel p-4 text-fg-muted text-sm">Carregando alertas…</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="panel p-4 text-fg-muted text-sm flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-positive" />
        Sem alertas. Continue jogando dentro da estratégia.
      </div>
    );
  }
  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      {data.map((a) => {
        const Icon = ICONS[a.severity];
        return (
          <div
            key={a.id}
            className={cn("panel p-3 flex gap-2.5 items-start", COLORS[a.severity])}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-fg-primary">{a.title}</div>
              <div className="text-xs text-fg-secondary mt-0.5 leading-snug">{a.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
