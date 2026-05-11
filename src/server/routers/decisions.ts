import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/db";
import { aggregateROI, totalProfit, totalInvested } from "@/core/roi";
import { itmRate } from "@/core/itm";
import { computeTrend } from "@/core/trend";
import { rankCombinations, topPositiveRankings, bottomNegativeRankings } from "@/core/rankings";
import { generateAlerts } from "@/core/alerts";
import { dailyBuyInRange, buyInTarget } from "@/core/buy-in-target";
import { currentBankroll } from "@/core/bankroll";
import type { Modality, PokerSite, RiskProfile } from "@/lib/types";

const loadContext = async () => {
  const [tournaments, transactions, settings] = await Promise.all([
    prisma.tournament.findMany({ orderBy: { playedAt: "desc" } }),
    prisma.transaction.findMany(),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);
  const riskProfile = (settings?.riskProfile ?? "moderate") as RiskProfile;
  const bankroll = currentBankroll(
    transactions.map((t) => ({
      kind: t.kind as "deposit" | "withdrawal",
      amount: t.amount,
      occurredAt: t.occurredAt,
    })),
    tournaments,
  );
  const modalities: Modality[] = uniqueModalities(tournaments);
  return { tournaments, transactions, settings, riskProfile, bankroll, modalities };
};

const uniqueModalities = (
  tournaments: readonly { isTurbo: boolean; isBounty: boolean }[],
): Modality[] => {
  const seen = new Set<string>();
  const out: Modality[] = [];
  for (const t of tournaments) {
    const key = `${t.isTurbo}|${t.isBounty}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ base: "MTT", isTurbo: t.isTurbo, isBounty: t.isBounty });
  }
  return out;
};

export const decisionsRouter = router({
  /** Headline KPIs for the home dashboard. */
  kpis: publicProcedure.query(async () => {
    const { tournaments, bankroll } = await loadContext();
    const lifetime = aggregateROI(tournaments);
    const trend = computeTrend(tournaments, 30);
    const last30 = tournaments.filter(
      (t) => t.playedAt >= new Date(Date.now() - 30 * 86_400_000),
    );
    return {
      bankroll,
      tournamentCount: tournaments.length,
      lifetimeROI: lifetime,
      roi30d: trend.recent,
      volume30d: last30.length,
      itmRateLifetime: itmRate(tournaments),
      totalProfit: totalProfit(tournaments),
      totalInvested: totalInvested(tournaments),
      trend,
    };
  }),

  /** Daily buy-in target range, given current bankroll + modality mix. */
  dailyTarget: publicProcedure.query(async () => {
    const { bankroll, riskProfile, modalities } = await loadContext();
    const range = dailyBuyInRange(bankroll, riskProfile, modalities);
    const breakdown = modalities.map((m) => ({
      modality: m,
      target: buyInTarget(bankroll, riskProfile, m),
    }));
    return { range, breakdown };
  }),

  /** Top N recommended (positive-score) combinations. */
  rankings: publicProcedure
    .input(z.object({ top: z.number().int().positive().max(50).default(5) }).optional())
    .query(async ({ input }) => {
      const { tournaments } = await loadContext();
      const top = input?.top ?? 5;
      return {
        top: topPositiveRankings(
          tournaments.map((t) => ({
            buyIn: t.buyIn,
            reEntries: t.reEntries,
            addOns: t.addOns,
            profit: t.profit,
            itm: t.itm,
            finalTablePosition: t.finalTablePosition,
            site: t.site as PokerSite,
            isTurbo: t.isTurbo,
            isBounty: t.isBounty,
          })),
          top,
        ),
        bottom: bottomNegativeRankings(
          tournaments.map((t) => ({
            buyIn: t.buyIn,
            reEntries: t.reEntries,
            addOns: t.addOns,
            profit: t.profit,
            itm: t.itm,
            finalTablePosition: t.finalTablePosition,
            site: t.site as PokerSite,
            isTurbo: t.isTurbo,
            isBounty: t.isBounty,
          })),
          top,
        ),
      };
    }),

  /** Full ranking table for the Decisões page. */
  allRankings: publicProcedure.query(async () => {
    const { tournaments } = await loadContext();
    return rankCombinations(
      tournaments.map((t) => ({
        buyIn: t.buyIn,
        reEntries: t.reEntries,
        addOns: t.addOns,
        profit: t.profit,
        itm: t.itm,
        finalTablePosition: t.finalTablePosition,
        site: t.site as PokerSite,
        isTurbo: t.isTurbo,
        isBounty: t.isBounty,
      })),
    );
  }),

  alerts: publicProcedure.query(async () => {
    const { tournaments, bankroll, riskProfile, modalities } = await loadContext();
    return generateAlerts({
      bankrollUsd: bankroll,
      riskProfile,
      modalitiesPlayed: modalities,
      tournaments,
    });
  }),

  /** Site/modality breakdown for charts. */
  bySite: publicProcedure.query(async () => {
    const { tournaments } = await loadContext();
    const bySite = new Map<string, { n: number; profit: number; cost: number }>();
    for (const t of tournaments) {
      const k = t.site;
      const slot = bySite.get(k) ?? { n: 0, profit: 0, cost: 0 };
      slot.n += 1;
      slot.profit += t.profit;
      slot.cost += t.buyIn * (1 + t.reEntries + t.addOns);
      bySite.set(k, slot);
    }
    return Array.from(bySite.entries()).map(([site, v]) => ({
      site,
      n: v.n,
      roi: v.cost > 0 ? v.profit / v.cost : 0,
      profit: v.profit,
    }));
  }),

  byModality: publicProcedure.query(async () => {
    const { tournaments } = await loadContext();
    const byMod = new Map<string, { n: number; profit: number; cost: number; label: string }>();
    for (const t of tournaments) {
      const k = `${t.isTurbo ? "T" : "N"}|${t.isBounty ? "B" : "R"}`;
      const label = `${t.isTurbo ? "Turbo" : "Regular"} ${t.isBounty ? "PKO" : "Std"}`;
      const slot = byMod.get(k) ?? { n: 0, profit: 0, cost: 0, label };
      slot.n += 1;
      slot.profit += t.profit;
      slot.cost += t.buyIn * (1 + t.reEntries + t.addOns);
      byMod.set(k, slot);
    }
    return Array.from(byMod.entries()).map(([key, v]) => ({
      key,
      label: v.label,
      n: v.n,
      roi: v.cost > 0 ? v.profit / v.cost : 0,
      profit: v.profit,
    }));
  }),
});
