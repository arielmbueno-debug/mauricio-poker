import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/db";
import { transactionInputSchema } from "@/lib/schemas";
import { currentBankroll, bankrollOverTime } from "@/core/bankroll";

export const bankrollRouter = router({
  current: publicProcedure.query(async () => {
    const [transactions, tournaments] = await Promise.all([
      prisma.transaction.findMany({ orderBy: { occurredAt: "asc" } }),
      prisma.tournament.findMany({ select: { profit: true, playedAt: true } }),
    ]);
    const bankroll = currentBankroll(
      transactions.map((t) => ({
        kind: t.kind as "deposit" | "withdrawal",
        amount: t.amount,
        occurredAt: t.occurredAt,
      })),
      tournaments,
    );
    const deposits = transactions
      .filter((t) => t.kind === "deposit")
      .reduce((s, t) => s + t.amount, 0);
    const withdrawals = transactions
      .filter((t) => t.kind === "withdrawal")
      .reduce((s, t) => s + t.amount, 0);
    const profits = tournaments.reduce((s, t) => s + t.profit, 0);
    return { bankroll, deposits, withdrawals, profits };
  }),

  history: publicProcedure.query(async () => {
    const [transactions, tournaments] = await Promise.all([
      prisma.transaction.findMany({ orderBy: { occurredAt: "asc" } }),
      prisma.tournament.findMany({ select: { profit: true, playedAt: true } }),
    ]);
    return bankrollOverTime(
      transactions.map((t) => ({
        kind: t.kind as "deposit" | "withdrawal",
        amount: t.amount,
        occurredAt: t.occurredAt,
      })),
      tournaments,
    );
  }),

  listTransactions: publicProcedure.query(() =>
    prisma.transaction.findMany({ orderBy: { occurredAt: "desc" } }),
  ),

  addTransaction: publicProcedure
    .input(transactionInputSchema)
    .mutation(({ input }) =>
      prisma.transaction.create({
        data: {
          kind: input.kind,
          amount: input.amount,
          occurredAt: input.occurredAt ?? new Date(),
          note: input.note ?? null,
        },
      }),
    ),

  deleteTransaction: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => prisma.transaction.delete({ where: { id: input.id } })),
});
