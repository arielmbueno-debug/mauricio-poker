# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                  # Next.js dev server (http://localhost:3000)
npm test                     # Vitest, one shot (src/**/*.test.{ts,tsx})
npm run test:watch           # TDD mode
npm test -- src/core/roi     # run a single file/folder
npm test -- -t "ROI agreg"   # run by test name
npm run typecheck            # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run lint                 # next lint
npm run db:push              # apply schema.prisma to SQLite
npm run db:seed              # re-seed 620 mock tournaments + 3 transactions
npm run db:reset             # force-reset + seed (destroys data)
```

`README.md` documents the full setup flow, scripts table, CSV import schema, and product decisions D1–D5. Read it before adding features.

**Avoid `npm run build` during AFK iterations** — it pollutes `.next/` and the dev server then crashes with "undefined.call" until the dir is cleared. Use `npm run typecheck` to validate types instead.

## Architecture

**End-to-end type safety via tRPC 11 + Zod + branded types.** The compiler enforces unit safety (USD vs BuyIns vs ROI cannot mix) even though everything is `number` at runtime.

### Layering

```
src/app/...           UI (Next.js App Router, RSC + client components)
   ↓ calls
src/lib/trpc/         tRPC client (TanStack Query)
   ↓ network
src/server/routers/   tRPC routers — IO + Zod validation
   ↓ calls
src/core/*.ts         Pure algorithms (no IO, no Prisma) — TDD'd
   +
src/lib/db.ts         Prisma singleton (SQLite)
```

The rule: `src/core/` is pure. It takes plain typed inputs (often branded) and returns plain outputs. Routers in `src/server/routers/` glue Prisma to core. **Don't import Prisma from `core/`**, and don't put business logic in routers — push it into `core/` with a test.

### Domain model quirks

- **Bankroll is computed, not stored**: `sum(deposits) − sum(withdrawals) + sum(tournament.profit)` in `src/core/bankroll.ts`. There is no balance column.
- **Modality is decomposed** (`src/lib/types.ts`): `{ base: "MTT", isTurbo, isBounty }`. Use `modalityKey()` for grouping and `modalityLabel()` for display. Don't reintroduce a flat enum.
- **Tiers come from buy-in** via `tierForBuyIn()` — micro / small / medium / high / super-high. Rankings group by `(site × modality × tier)`.
- **Site enum is stored as string** in SQLite for portability (`POKERSTARS`, `GGPOKER`, etc. — see `POKER_SITES`). Display labels live in `SITE_LABEL`.
- **Sample size is first-class.** Anything that displays an ROI or rate should also surface confidence via `src/core/sample-size.ts` or `src/core/wilson.ts`. Shrinkage (`k=30`) is applied in `risk-adjusted-roi.ts` — don't show raw means for small n.
- **Final-table position** is only recorded when the player reached the FT (`finalTablePosition` is nullable on purpose).

### Validation boundaries

Zod schemas live in `src/lib/schemas.ts` and run at **CSV import, form submit, and tRPC input**. Inside `core/` we trust the types — don't re-validate.

### Path alias

`@/*` → `./src/*` (configured in both `tsconfig.json` and `vitest.config.ts`). Always prefer `@/core/...` over relative paths across feature boundaries.

### Tests

Vitest runs in `node` environment with `globals: true` (no need to import `describe`/`it`). Coverage is configured for `src/core/**` only — that's the contract: every algorithm in `core/` ships with a `.test.ts` next to it.
