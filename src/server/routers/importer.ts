import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/db";
import { csvRowSchema, tournamentInputSchema } from "@/lib/schemas";
import { POKER_SITES, type PokerSite } from "@/lib/types";

const SITE_ALIASES: Record<string, PokerSite> = {
  pokerstars: "POKERSTARS",
  stars: "POKERSTARS",
  ps: "POKERSTARS",
  gg: "GGPOKER",
  ggpoker: "GGPOKER",
  "gg network": "GGPOKER",
  party: "PARTYPOKER",
  partypoker: "PARTYPOKER",
  "888": "POKER888",
  "888poker": "POKER888",
  wpt: "WPT_GLOBAL",
  "wpt global": "WPT_GLOBAL",
};

const truthy = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "1" || s === "true" || s === "sim" || s === "yes" || s === "y";
  }
  return false;
};

const numberOr = (v: unknown, fallback = 0): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,]/g, ".").replace(/[^\d.\-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const normalizeSite = (raw: string): PokerSite | null => {
  const key = raw.trim().toLowerCase();
  const direct = POKER_SITES.find((s) => s.toLowerCase() === key.replace(/[^a-z]/g, ""));
  if (direct) return direct;
  return SITE_ALIASES[key] ?? null;
};

export const importerRouter = router({
  /**
   * Validates an array of CSV rows. Returns parsed tournaments and per-row errors.
   * Does not persist; use commit to insert.
   */
  preview: publicProcedure
    .input(z.object({ rows: z.array(z.record(z.string(), z.unknown())).max(5000) }))
    .mutation(({ input }) => {
      const valid: z.infer<typeof tournamentInputSchema>[] = [];
      const errors: { row: number; message: string }[] = [];
      input.rows.forEach((raw, idx) => {
        const parsed = csvRowSchema.safeParse(raw);
        if (!parsed.success) {
          errors.push({ row: idx + 1, message: parsed.error.issues[0]?.message ?? "Invalid row" });
          return;
        }
        const r = parsed.data;
        const site = normalizeSite(String(r.site));
        if (!site) {
          errors.push({ row: idx + 1, message: `Site desconhecido: ${r.site}` });
          return;
        }
        const playedAt = new Date(r.data);
        if (Number.isNaN(playedAt.getTime())) {
          errors.push({ row: idx + 1, message: `Data inválida: ${r.data}` });
          return;
        }
        const t = tournamentInputSchema.safeParse({
          playedAt,
          site,
          buyIn: numberOr(r.buy_in),
          reEntries: numberOr(r.re_entries, 0),
          addOns: numberOr(r.add_ons, 0),
          isTurbo: truthy(r.turbo),
          isBounty: truthy(r.bounty),
          itm: truthy(r.itm),
          finalTablePosition: r.posicao_mesa_final
            ? numberOr(r.posicao_mesa_final)
            : null,
          fieldSize: r.field_size ? numberOr(r.field_size) : null,
          profit: numberOr(r.lucro),
        });
        if (!t.success) {
          errors.push({ row: idx + 1, message: t.error.issues[0]?.message ?? "Validation error" });
          return;
        }
        valid.push(t.data);
      });
      return { valid, errors, totalRows: input.rows.length };
    }),

  commit: publicProcedure
    .input(z.object({ tournaments: z.array(tournamentInputSchema).max(5000) }))
    .mutation(async ({ input }) => {
      const result = await prisma.tournament.createMany({ data: input.tournaments });
      return { inserted: result.count };
    }),
});
