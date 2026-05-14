/**
 * Reads the user's raw spreadsheet, converts to the importer schema,
 * wipes the DB (force-reset), and inserts the tournaments.
 *
 * Run: npx tsx scripts/import-from-csv.ts <path-to-csv>
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const SITE_MAP: Record<string, string> = {
  "888": "POKER888",
  "poker stars": "POKERSTARS",
  "party poker": "PARTYPOKER",
  gg: "GGPOKER",
};

function parseLine(l: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let q = false;
  for (const c of l) {
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === "," && !q) {
      cols.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  cols.push(cur);
  return cols;
}

function parseMoney(s: string | undefined): number | null {
  if (!s) return null;
  const t = String(s).trim();
  if (!t) return null;
  const cleaned = t.replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function truthy(v: string | undefined): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "sim" || s === "✔" || s === "x";
}

function parseDate(dia: string): Date | null {
  // DD/MM/YYYY
  const m = dia.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d), 12, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: tsx scripts/import-from-csv.ts <csv>");
  process.exit(1);
}

const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/);
const tournaments: {
  playedAt: Date;
  site: string;
  buyIn: number;
  reEntries: number;
  addOns: number;
  isTurbo: boolean;
  isBounty: boolean;
  itm: boolean;
  finalTablePosition: number | null;
  fieldSize: number | null;
  profit: number;
}[] = [];

const skipped = { unsupported: 0, badDate: 0, badBuyIn: 0 };
let lucroFallback = 0;

for (let i = 1; i < lines.length; i++) {
  const l = lines[i];
  if (!l) continue;
  const c = parseLine(l);
  const playedAt = parseDate((c[0] ?? "").trim());
  if (!playedAt) {
    skipped.badDate++;
    continue;
  }
  const siteRaw = (c[3] ?? "").trim().toLowerCase();
  const site = SITE_MAP[siteRaw];
  if (!site) {
    skipped.unsupported++;
    continue;
  }
  const buyIn = parseMoney(c[4]);
  if (!buyIn || buyIn <= 0) {
    skipped.badBuyIn++;
    continue;
  }
  const entradas = parseInt((c[5] ?? "1").replace(/[^0-9]/g, ""), 10) || 1;
  const rebuy = truthy(c[6]);
  const addon = truthy(c[7]);
  const reEntries = Math.max(entradas - 1, 0) + (rebuy ? 1 : 0);
  const addOns = addon ? 1 : 0;
  const isBounty = truthy(c[8]);
  const itm = truthy(c[10]);
  const ft = truthy(c[14]);
  const posRaw = (c[15] ?? "").trim();
  const finalTablePosition = ft && posRaw ? parseInt(posRaw.replace(/[^0-9]/g, ""), 10) || null : null;
  const tipo = (c[16] ?? "").toLowerCase();
  const isTurbo = /turbo|hyper/.test(tipo);

  let profit = parseMoney(c[17]);
  if (profit === null) {
    const prizeBounty = parseMoney(c[13]) ?? 0;
    const totalBi = parseMoney(c[1]) ?? buyIn * (1 + reEntries + addOns);
    profit = prizeBounty - totalBi;
    lucroFallback++;
  }

  tournaments.push({
    playedAt,
    site,
    buyIn,
    reEntries,
    addOns,
    isTurbo,
    isBounty,
    itm,
    finalTablePosition,
    fieldSize: null,
    profit,
  });
}

console.log("Parsed:", tournaments.length, "tournaments");
console.log("Skipped (site não suportado):", skipped.unsupported);
console.log("Skipped (data inválida):", skipped.badDate);
console.log("Skipped (buy-in inválido):", skipped.badBuyIn);
console.log("Profit calculado de PRIZE-BI (RESULTADO vazio):", lucroFallback);

const totalCost = tournaments.reduce((s, t) => s + t.buyIn * (1 + t.reEntries + t.addOns), 0);
const totalProfit = tournaments.reduce((s, t) => s + t.profit, 0);
console.log("Volume total: $" + totalCost.toFixed(2));
console.log("Lucro total : $" + totalProfit.toFixed(2));
console.log("ROI         :", ((totalProfit / totalCost) * 100).toFixed(2) + "%");

const prisma = new PrismaClient();
async function main() {
  const beforeT = await prisma.tournament.count();
  const beforeX = await prisma.transaction.count();
  console.log(`\nDB antes: ${beforeT} torneios, ${beforeX} transações`);
  console.log("Apagando tudo...");
  await prisma.tournament.deleteMany();
  await prisma.transaction.deleteMany();
  console.log("Inserindo", tournaments.length, "torneios...");
  const result = await prisma.tournament.createMany({ data: tournaments });
  const afterT = await prisma.tournament.count();
  console.log(`DB depois: ${afterT} torneios (inserted=${result.count})`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
