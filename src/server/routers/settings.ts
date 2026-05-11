import { router, publicProcedure } from "../trpc";
import { prisma } from "@/lib/db";
import { riskProfileSchema } from "@/lib/schemas";
import { z } from "zod";

export const settingsRouter = router({
  get: publicProcedure.query(async () => {
    let s = await prisma.settings.findUnique({ where: { id: "singleton" } });
    if (!s) {
      s = await prisma.settings.create({
        data: { id: "singleton", riskProfile: "moderate", defaultCurrency: "USD" },
      });
    }
    return s;
  }),

  update: publicProcedure
    .input(
      z.object({
        riskProfile: riskProfileSchema.optional(),
        defaultCurrency: z.enum(["USD", "BRL"]).optional(),
      }),
    )
    .mutation(({ input }) =>
      prisma.settings.upsert({
        where: { id: "singleton" },
        create: {
          id: "singleton",
          riskProfile: input.riskProfile ?? "moderate",
          defaultCurrency: input.defaultCurrency ?? "USD",
        },
        update: input,
      }),
    ),
});
