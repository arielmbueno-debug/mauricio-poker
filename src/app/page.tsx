"use client";

import { trpc } from "@/lib/trpc/client";
import { KpiCard } from "@/components/kpi/KpiCard";
import { BankrollChart } from "@/components/charts/BankrollChart";
import { RoiBySiteChart } from "@/components/charts/RoiBySiteChart";
import { RoiByModalityChart } from "@/components/charts/RoiByModalityChart";
import { DailyTargetCard } from "@/components/decisions/DailyTargetCard";
import { AlertsList } from "@/components/decisions/AlertsList";
import { RankingsTable } from "@/components/decisions/RankingsTable";
import { fmtUSD, fmtPct, fmtInt } from "@/lib/utils";
import { Wallet, TrendingUp, Activity, Trophy, BarChart3 } from "lucide-react";

export default function HomePage() {
  const { data } = trpc.decisions.kpis.useQuery();
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Visão Geral</h1>
          <p className="text-2xs text-fg-muted mt-0.5">
            Dashboard de decisões — KPIs, evolução de banca e leitura do histórico.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Bankroll"
          value={data ? fmtUSD(data.bankroll, { compact: true }) : "—"}
          hint="Depósitos + lucros − saques"
          icon={Wallet}
        />
        <KpiCard
          label="ROI Lifetime"
          value={data ? fmtPct(data.lifetimeROI) : "—"}
          hint={data ? `${fmtInt(data.tournamentCount)} torneios` : ""}
          intent={data ? (data.lifetimeROI >= 0 ? "positive" : "negative") : "default"}
          icon={TrendingUp}
        />
        <KpiCard
          label="ROI 30 dias"
          value={data ? fmtPct(data.roi30d) : "—"}
          hint={
            data
              ? data.trend.direction === "improving"
                ? "▲ tendência subindo"
                : data.trend.direction === "worsening"
                  ? "▼ tendência caindo"
                  : "• estável"
              : ""
          }
          intent={data ? (data.roi30d >= 0 ? "positive" : "negative") : "default"}
          icon={Activity}
        />
        <KpiCard
          label="Volume 30 dias"
          value={data ? `${fmtInt(data.volume30d)}t` : "—"}
          hint="torneios"
          icon={BarChart3}
        />
        <KpiCard
          label="ITM Lifetime"
          value={data ? `${(data.itmRateLifetime * 100).toFixed(1)}%` : "—"}
          hint="taxa em the money"
          icon={Trophy}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <BankrollChart />
        </div>
        <DailyTargetCard />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RoiBySiteChart />
        <RoiByModalityChart />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Top combinações (positivas)
          </h2>
        </div>
        <RankingsTable mode="top" />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Alertas
          </h2>
        </div>
        <AlertsList />
      </section>
    </div>
  );
}
