import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';

export const getLocationHistoryProcedure = publicProcedure
  .input(z.object({
    driverId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().optional().default(1000),
  }))
  .query(({ input }) => {
    let query = 'SELECT * FROM locationHistory WHERE driverId = ?';
    const params: any[] = [input.driverId];

    if (input.startDate) {
      query += ' AND timestamp >= ?';
      params.push(input.startDate);
    }

    if (input.endDate) {
      query += ' AND timestamp <= ?';
      params.push(input.endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(input.limit);

    const history = db.prepare(query).all(...params);

    return history;
  });
