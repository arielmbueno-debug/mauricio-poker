/**
 * Realistic mock seed:
 * - 1 initial deposit ($5000), 2 withdrawals
 * - ~600 tournaments over 18 months
 * - Distribution: GG=50%, PokerStars=40%, partypoker=10%
 * - MTT vs PKO ≈ 55/45. Turbo flag ≈ 35%.
 * - Buy-in tier mix: micro 15%, small 50%, medium 30%, high 5%.
 * - Each (site, modality, tier) combo has a baseline ROI; per-tournament profit
 *   is sampled from a distribution that produces realistic variance.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SITES = ["GGPOKER", "POKERSTARS", "PARTYPOKER"] as const;
const SITE_WEIGHTS = [0.5, 0.4, 0.1];

const TIERS = [
  { min: 1, max: 5, weight: 0.15 },   // micro
  { min: 6, max: 22, weight: 0.5 },   // small
  { min: 22, max: 109, weight: 0.3 }, // medium
  { min: 109, max: 215, weight: 0.05 }, // high
];

// Baseline ROI (mean lucro/buy-in) per (site, isTurbo, isBounty).
const ROI_BASELINE: Record<string, number> = {
  "GGPOKER|N|R": 0.08,
  "GGPOKER|T|R": -0.02,
  "GGPOKER|N|B": 0.22, // user's edge in PKO at GG
  "GGPOKER|T|B": 0.15,
  "POKERSTARS|N|R": 0.05,
  "POKERSTARS|T|R": -0.08,
  "POKERSTARS|N|B": 0.10,
  "POKERSTARS|T|B": 0.04,
  "PARTYPOKER|N|R": -0.10,
  "PARTYPOKER|T|R": -0.20,
  "PARTYPOKER|N|B": -0.05,
  "PARTYPOKER|T|B": -0.12,
};

const sampleWeighted = <T>(items: readonly T[], weights: readonly number[]): T => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const sampleTier = () => sampleWeighted(TIERS, TIERS.map((t) => t.weight));

/**
 * Sample tournament profit. The cash payout multiplier (M = prize / buy-in)
 * is drawn from an exponential distribution calibrated so that E[profit/cost]
 * matches the supplied baseline ROI:
 *   E[M] = (1 + baselineROI) / cashRate
 */
const sampleProfit = (
  buyIn: number,
  totalCost: number,
  baselineROI: number,
): { profit: number; itm: boolean; ftPos: number | null } => {
  const cashRate = 0.22; // realistic ITM rate
  const r = Math.random();
  if (r > cashRate) {
    return { profit: -totalCost, itm: false, ftPos: null };
  }
  const u = r / cashRate; // 0..1
  const meanM = Math.max(0.5, (1 + baselineROI) / cashRate);
  // Exponential draw, mean = meanM
  const M = -Math.log(1 - u + 0.001) * meanM;
  const profit = buyIn * M - totalCost;
  const itm = true;
  // FT reach when prize ≥ 10x buy-in (heuristic for deep run)
  const ftPos = M >= 10 ? (M >= 40 ? 1 : randInt(2, 9)) : null;
  return { profit, itm, ftPos };
};

const generateTournaments = (count: number) => {
  const tournaments: Array<Parameters<typeof prisma.tournament.create>[0]["data"]> = [];
  const now = new Date();
  const startMs = now.getTime() - 18 * 30 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const site = sampleWeighted(SITES, SITE_WEIGHTS);
    const tier = sampleTier();
    const buyIn = Math.round(randFloat(tier.min, tier.max) * 100) / 100;
    const isTurbo = Math.random() < 0.35;
    const isBounty = Math.random() < 0.45;
    const reEntries = Math.random() < 0.25 ? randInt(1, 2) : 0;
    const addOns = 0;
    const totalCost = buyIn * (1 + reEntries + addOns);

    const key = `${site}|${isTurbo ? "T" : "N"}|${isBounty ? "B" : "R"}`;
    const baselineROI = ROI_BASELINE[key] ?? 0;

    const playedAt = new Date(startMs + Math.random() * (now.getTime() - startMs));

    const { profit, itm, ftPos } = sampleProfit(buyIn, totalCost, baselineROI);
    // small correction so empirical mean drifts toward baseline (mostly cosmetic)
    const correction = baselineROI * totalCost * 0.15;
    const correctedProfit = profit + correction;

    const fieldSize = randInt(80, 5000);

    tournaments.push({
      playedAt,
      site,
      buyIn,
      reEntries,
      addOns,
      isTurbo,
      isBounty,
      itm,
      finalTablePosition: ftPos,
      fieldSize,
      profit: Math.round(correctedProfit * 100) / 100,
    });
  }
  return tournaments;
};

async function main() {
  console.log("Clearing existing data...");
  await prisma.tournament.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.settings.deleteMany();

  console.log("Creating settings...");
  await prisma.settings.create({
    data: { id: "singleton", riskProfile: "moderate", defaultCurrency: "USD" },
  });

  console.log("Creating transactions...");
  const eighteenMonthsAgo = new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000);
  await prisma.transaction.createMany({
    data: [
      { kind: "deposit", amount: 5000, occurredAt: eighteenMonthsAgo, note: "Banca inicial" },
      {
        kind: "withdrawal",
        amount: 1500,
        occurredAt: new Date(eighteenMonthsAgo.getTime() + 6 * 30 * 24 * 60 * 60 * 1000),
        note: "Saque planejado",
      },
      {
        kind: "withdrawal",
        amount: 800,
        occurredAt: new Date(eighteenMonthsAgo.getTime() + 13 * 30 * 24 * 60 * 60 * 1000),
        note: "Saque planejado",
      },
    ],
  });

  console.log("Generating tournaments...");
  const tournaments = generateTournaments(620);
  await prisma.tournament.createMany({ data: tournaments });

  console.log(`✔ Seeded ${tournaments.length} tournaments + 3 transactions.`);

  // Print quick sanity stats
  const allTournaments = await prisma.tournament.findMany();
  const totalSpent = allTournaments.reduce(
    (s, t) => s + t.buyIn * (1 + t.reEntries + t.addOns),
    0,
  );
  const totalProfit = allTournaments.reduce((s, t) => s + t.profit, 0);
  console.log(
    `Aggregate ROI: ${((totalProfit / totalSpent) * 100).toFixed(2)}%  (profit $${totalProfit.toFixed(0)} / spent $${totalSpent.toFixed(0)})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
