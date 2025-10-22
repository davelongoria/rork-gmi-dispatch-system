import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { syncDataProcedure } from "./routes/data/sync/route";
import { getAllDataProcedure } from "./routes/data/get-all/route";
import { exportAsDefaultsProcedure } from "./routes/data/export-as-defaults/route";
import { resetDatabaseProcedure } from "./routes/data/reset-database/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  data: createTRPCRouter({
    sync: syncDataProcedure,
    getAll: getAllDataProcedure,
    exportAsDefaults: exportAsDefaultsProcedure,
    resetDatabase: resetDatabaseProcedure,
  }),
});

export type AppRouter = typeof appRouter;
