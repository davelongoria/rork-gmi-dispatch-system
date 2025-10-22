import { publicProcedure } from "@/backend/trpc/create-context";
import { unlinkSync, existsSync } from "fs";
import { join } from "path";

export const resetDatabaseProcedure = publicProcedure.mutation(() => {
  const dbPath = join(process.cwd(), 'data', 'app.db');
  
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
    console.log('Database file deleted successfully');
    
    return {
      success: true,
      message: 'Database reset successfully. Restart the server to reseed with default data.',
    };
  } else {
    return {
      success: false,
      message: 'Database file not found',
    };
  }
});
