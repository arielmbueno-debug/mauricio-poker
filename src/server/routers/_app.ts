import { router } from "../trpc";
import { tournamentsRouter } from "./tournaments";
import { bankrollRouter } from "./bankroll";
import { decisionsRouter } from "./decisions";
import { importerRouter } from "./importer";
import { settingsRouter } from "./settings";

export const appRouter = router({
  tournaments: tournamentsRouter,
  bankroll: bankrollRouter,
  decisions: decisionsRouter,
  importer: importerRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
