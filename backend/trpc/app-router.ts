import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { syncDataProcedure } from "./routes/data/sync/route";
import { getAllDataProcedure } from "./routes/data/get-all/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  data: createTRPCRouter({
    sync: syncDataProcedure,
    getAll: getAllDataProcedure,
  }),
});

export type AppRouter = typeof appRouter;
