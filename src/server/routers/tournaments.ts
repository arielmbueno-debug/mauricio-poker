import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/db";
import { tournamentInputSchema } from "@/lib/schemas";
import { POKER_SITES } from "@/lib/types";

export const tournamentsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          take: z.number().int().positive().max(1000).default(100),
          site: z.enum(POKER_SITES).optional(),
          isTurbo: z.boolean().optional(),
          isBounty: z.boolean().optional(),
          minBuyIn: z.number().nonnegative().optional(),
          maxBuyIn: z.number().positive().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const where: Parameters<typeof prisma.tournament.findMany>[0] = { where: {} };
      if (input?.site) where.where!.site = input.site;
      if (input?.isTurbo !== undefined) where.where!.isTurbo = input.isTurbo;
      if (input?.isBounty !== undefined) where.where!.isBounty = input.isBounty;
      if (input?.minBuyIn !== undefined || input?.maxBuyIn !== undefined) {
        where.where!.buyIn = {};
        if (input.minBuyIn !== undefined)
          (where.where!.buyIn as { gte?: number }).gte = input.minBuyIn;
        if (input.maxBuyIn !== undefined)
          (where.where!.buyIn as { lte?: number }).lte = input.maxBuyIn;
      }
      return prisma.tournament.findMany({
        ...where,
        orderBy: { playedAt: "desc" },
        take: input?.take ?? 100,
      });
    }),

  count: publicProcedure.query(() => prisma.tournament.count()),

  create: publicProcedure.input(tournamentInputSchema).mutation(({ input }) =>
    prisma.tournament.create({ data: input }),
  ),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: tournamentInputSchema.partial() }))
    .mutation(({ input }) =>
      prisma.tournament.update({ where: { id: input.id }, data: input.data }),
    ),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => prisma.tournament.delete({ where: { id: input.id } })),

  bulkCreate: publicProcedure
    .input(z.array(tournamentInputSchema).max(5000))
    .mutation(async ({ input }) => {
      const result = await prisma.tournament.createMany({ data: input });
      return { count: result.count };
    }),
});
