"use client";

import { trpc } from "@/lib/trpc/client";
import { fmtPct, fmtUSD, fmtInt, cn } from "@/lib/utils";

const CONFIDENCE_PILL: Record<string, string> = {
  low: "border-negative/40 text-negative bg-negative-dim/30",
  moderate: "border-warning/40 text-warning bg-warning-dim/30",
  good: "border-info/40 text-info bg-info-dim/30",
  high: "border-positive/40 text-positive bg-positive-dim/30",
};

export function RankingsTable({ mode = "full" }: { mode?: "full" | "top" | "bottom" }) {
  const { data: full, isLoading: lFull } = trpc.decisions.allRankings.useQuery(undefined, {
    enabled: mode === "full",
  });
  const { data: tops, isLoading: lTops } = trpc.decisions.rankings.useQuery(
    { top: 5 },
    { enabled: mode !== "full" },
  );

  const rows = mode === "full" ? full ?? [] : mode === "top" ? tops?.top ?? [] : tops?.bottom ?? [];
  const isLoading = mode === "full" ? lFull : lTops;

  if (isLoading) {
    return <div className="panel p-4 text-fg-muted text-sm">Calculando rankings…</div>;
  }
  if (rows.length === 0) {
    return (
      <div className="panel p-4 text-fg-muted text-sm">
        Sem dados suficientes para ranking.
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-xs tabular">
        <thead className="text-fg-muted border-b border-border bg-bg-elev/50">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider">Combinação</th>
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">n</th>
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">ROI</th>
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">ITM</th>
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">σ</th>
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">Score</th>
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">Lucro</th>
            <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider">Conf.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="table-row">
              <td className="px-3 py-2 text-fg-primary">{r.label}</td>
              <td className="px-3 py-2 text-right text-fg-secondary">{fmtInt(r.n)}</td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-medium",
                  r.aggregateROI >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {fmtPct(r.aggregateROI)}
              </td>
              <td className="px-3 py-2 text-right text-fg-secondary">
                {(r.itmRate * 100).toFixed(0)}%
              </td>
              <td className="px-3 py-2 text-right text-fg-muted">{r.stddev.toFixed(2)}</td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-medium",
                  r.score >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {r.score.toFixed(2)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right",
                  r.totalProfit >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {fmtUSD(r.totalProfit, { compact: true })}
              </td>
              <td className="px-3 py-2">
                <span className={cn("pill", CONFIDENCE_PILL[r.confidence])}>{r.confidence}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
