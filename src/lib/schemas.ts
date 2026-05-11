/**
 * Zod schemas — runtime validation at every boundary (CSV input, form input, tRPC input).
 * Internal code trusts types; only validate at the edge.
 */

import { z } from "zod";
import { POKER_SITES, RISK_PROFILES } from "./types";

export const pokerSiteSchema = z.enum(POKER_SITES);

export const riskProfileSchema = z.enum(RISK_PROFILES);

export const tournamentInputSchema = z.object({
  playedAt: z.coerce.date(),
  site: pokerSiteSchema,
  buyIn: z.coerce.number().nonnegative().max(100_000),
  reEntries: z.coerce.number().int().nonnegative().default(0),
  addOns: z.coerce.number().int().nonnegative().default(0),
  isTurbo: z.coerce.boolean().default(false),
  isBounty: z.coerce.boolean().default(false),
  itm: z.coerce.boolean().default(false),
  finalTablePosition: z.coerce.number().int().positive().nullable().optional(),
  fieldSize: z.coerce.number().int().positive().nullable().optional(),
  profit: z.coerce.number(),
  notes: z.string().max(500).optional().nullable(),
});

export type TournamentInput = z.infer<typeof tournamentInputSchema>;

export const transactionInputSchema = z.object({
  kind: z.enum(["deposit", "withdrawal"]),
  amount: z.coerce.number().positive(),
  occurredAt: z.coerce.date().optional(),
  note: z.string().max(200).optional().nullable(),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

/** Lenient CSV row schema — accepts pt-BR header variants. Normalized after parse. */
export const csvRowSchema = z.object({
  data: z.string().min(1),
  site: z.string().min(1),
  buy_in: z.union([z.string(), z.number()]),
  re_entries: z.union([z.string(), z.number()]).optional().default(0),
  add_ons: z.union([z.string(), z.number()]).optional().default(0),
  turbo: z.union([z.string(), z.boolean()]).optional().default(false),
  bounty: z.union([z.string(), z.boolean()]).optional().default(false),
  itm: z.union([z.string(), z.boolean()]).optional().default(false),
  posicao_mesa_final: z.union([z.string(), z.number()]).optional().nullable(),
  field_size: z.union([z.string(), z.number()]).optional().nullable(),
  lucro: z.union([z.string(), z.number()]),
});

export type CsvRow = z.infer<typeof csvRowSchema>;
