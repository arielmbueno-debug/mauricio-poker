/**
 * Generate human-readable alerts/insights from history. These are short
 * recommendations the user sees on the dashboard.
 */

import type { RiskProfile, Modality } from "@/lib/types";
import { dailyBuyInRange } from "./buy-in-target";
import { aggregateROI, type TournamentForRoi } from "./roi";
import { computeTrend, type TournamentWithDate } from "./trend";

export type AlertSeverity = "info" | "warning" | "danger" | "positive";

export type Alert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
};

export type AlertContext = {
  bankrollUsd: number;
  riskProfile: RiskProfile;
  modalitiesPlayed: readonly Modality[];
  tournaments: readonly (TournamentWithDate & { buyIn: number })[];
};

export const generateAlerts = (ctx: AlertContext): Alert[] => {
  const alerts: Alert[] = [];

  // 1. Bankroll exposure: any tournament in last 30 days above max BI?
  const range = dailyBuyInRange(ctx.bankrollUsd, ctx.riskProfile, ctx.modalitiesPlayed);
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentOverroll = ctx.tournaments.filter(
    (t) => t.playedAt >= cutoff && t.buyIn > range.max,
  );
  if (recentOverroll.length > 0) {
    const maxBI = Math.max(...recentOverroll.map((t) => t.buyIn));
    alerts.push({
      id: "br-exposure",
      severity: "warning",
      title: "Exposição acima da banca",
      message: `Você jogou ${recentOverroll.length} torneio(s) acima do buy-in seguro (máx atual: $${range.max.toFixed(0)}, jogou até $${maxBI.toFixed(0)}) nos últimos 30 dias.`,
    });
  }

  // 2. Trend
  const trend = computeTrend(ctx.tournaments, 30);
  if (trend.direction === "improving" && ctx.tournaments.length >= 60) {
    alerts.push({
      id: "trend-improving",
      severity: "positive",
      title: "ROI subindo",
      message: `Últimos 30 dias: ${(trend.recent * 100).toFixed(1)}% ROI (lifetime: ${(trend.lifetime * 100).toFixed(1)}%). Mantenha o ritmo.`,
    });
  } else if (trend.direction === "worsening" && ctx.tournaments.length >= 60) {
    alerts.push({
      id: "trend-worsening",
      severity: "danger",
      title: "Possível downswing",
      message: `Últimos 30 dias: ${(trend.recent * 100).toFixed(1)}% ROI vs lifetime ${(trend.lifetime * 100).toFixed(1)}%. Considere revisar volume/estrutura.`,
    });
  }

  // 3. Low volume in last 30d
  const recentCount = ctx.tournaments.filter((t) => t.playedAt >= cutoff).length;
  const lifetimeMonthlyAvg = ctx.tournaments.length / Math.max(1, monthsSpan(ctx.tournaments));
  if (ctx.tournaments.length > 100 && recentCount < lifetimeMonthlyAvg * 0.5) {
    alerts.push({
      id: "low-volume",
      severity: "info",
      title: "Volume abaixo da média",
      message: `${recentCount} torneios nos últimos 30 dias vs média mensal de ${Math.round(lifetimeMonthlyAvg)}.`,
    });
  }

  // 4. Bankroll growth check
  const totalProfit = ctx.tournaments.reduce((s, t) => s + t.profit, 0);
  const overallROI = aggregateROI(ctx.tournaments);
  if (ctx.tournaments.length >= 200 && overallROI > 0.1 && totalProfit > ctx.bankrollUsd * 0.3) {
    alerts.push({
      id: "consider-move-up",
      severity: "positive",
      title: "Considere subir de limite",
      message: `Lucro acumulado de $${totalProfit.toFixed(0)} com ROI ${(overallROI * 100).toFixed(1)}%. Banca permite testar um tier acima.`,
    });
  }

  return alerts;
};

const monthsSpan = (tournaments: readonly TournamentWithDate[]): number => {
  if (tournaments.length === 0) return 1;
  const dates = tournaments.map((t) => t.playedAt.getTime());
  const span = Math.max(...dates) - Math.min(...dates);
  return Math.max(1, span / (30 * 24 * 60 * 60 * 1000));
};

export { monthsSpan };
