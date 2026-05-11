"use client";

import { trpc } from "@/lib/trpc/client";
import { fmtUSD, fmtPct } from "@/lib/utils";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";

export function TopBar() {
  const { data, isLoading } = trpc.decisions.kpis.useQuery();

  return (
    <header className="h-14 border-b border-border bg-bg-panel/60 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {isLoading || !data ? (
          <div className="flex items-center gap-2 text-fg-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> carregando…
          </div>
        ) : (
          <>
            <TopBarStat label="BANKROLL" value={fmtUSD(data.bankroll, { compact: true })} />
            <TopBarStat
              label="ROI LIFETIME"
              value={fmtPct(data.lifetimeROI)}
              positive={data.lifetimeROI >= 0}
            />
            <TopBarStat
              label="ROI 30d"
              value={fmtPct(data.roi30d)}
              positive={data.roi30d >= 0}
              delta={data.trend.delta}
            />
            <TopBarStat label="VOLUME 30d" value={`${data.volume30d}t`} />
          </>
        )}
      </div>
      <div className="text-2xs text-fg-muted tabular">
        {new Date().toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </div>
    </header>
  );
}

function TopBarStat({
  label,
  value,
  positive,
  delta,
}: {
  label: string;
  value: string;
  positive?: boolean;
  delta?: number;
}) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-2xs text-fg-muted uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-sm font-semibold tabular ${
            positive === undefined
              ? "text-fg-primary"
              : positive
                ? "text-positive"
                : "text-negative"
          }`}
        >
          {value}
        </span>
        {delta !== undefined && Math.abs(delta) > 0.001 && (
          <span
            className={`text-2xs tabular flex items-center gap-0.5 ${
              delta >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {delta >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(delta * 100).toFixed(1)}pp
          </span>
        )}
      </div>
    </div>
  );
}
