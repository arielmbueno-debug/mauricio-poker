"use client";

import { DailyTargetCard } from "@/components/decisions/DailyTargetCard";
import { AlertsList } from "@/components/decisions/AlertsList";
import { RankingsTable } from "@/components/decisions/RankingsTable";

export default function DecisoesPage() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Decisões</h1>
          <p className="text-2xs text-fg-muted mt-0.5">
            Ranking risk-adjusted de cada combinação (site × modalidade × tier) com
            sample-size shrinkage. Score positivo = priorize. Score negativo = evite.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <AlertsList />
        </div>
        <DailyTargetCard />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Top a priorizar
          </h2>
        </div>
        <RankingsTable mode="top" />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Pior a evitar
          </h2>
        </div>
        <RankingsTable mode="bottom" />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Todas as combinações
          </h2>
          <span className="text-2xs text-fg-muted">
            Score = ratio ajustado por sample size (shrinkage k=30)
          </span>
        </div>
        <RankingsTable mode="full" />
      </section>
    </div>
  );
}
