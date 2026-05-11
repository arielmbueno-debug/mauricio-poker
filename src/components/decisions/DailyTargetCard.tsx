"use client";

import { trpc } from "@/lib/trpc/client";
import { Target } from "lucide-react";
import { fmtUSD, fmtInt } from "@/lib/utils";
import { modalityLabel } from "@/lib/types";

export function DailyTargetCard() {
  const { data, isLoading } = trpc.decisions.dailyTarget.useQuery();
  if (isLoading || !data) {
    return <div className="panel p-4 text-fg-muted text-sm">Calculando alvo…</div>;
  }
  const { range, breakdown } = data;
  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Buy-in alvo do dia</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular text-fg-primary">
          {fmtUSD(range.min)} – {fmtUSD(range.max)}
        </span>
      </div>
      <div className="text-2xs text-fg-muted">
        Range seguro baseado na sua banca atual e mix de modalidades.
      </div>
      <div className="divider my-1" />
      <div className="space-y-1.5">
        <div className="stat-label">DETALHE POR MODALIDADE</div>
        {breakdown.map((b) => (
          <div
            key={modalityLabel(b.modality)}
            className="flex items-center justify-between text-xs tabular"
          >
            <span className="text-fg-secondary">{modalityLabel(b.modality)}</span>
            <span className="text-fg-primary">
              até {fmtUSD(b.target.max)} ({fmtInt(b.target.multiplier)} BIs)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
