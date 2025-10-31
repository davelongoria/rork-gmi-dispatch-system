import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { db } from '@/backend/db';

export const addLocationHistoryProcedure = publicProcedure
  .input(z.object({
    driverId: z.string(),
    driverName: z.string().optional(),
    truckId: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    speed: z.number().optional(),
    heading: z.number().optional(),
    altitude: z.number().optional(),
    accuracy: z.number().optional(),
    timestamp: z.string(),
  }))
  .mutation(async ({ input }) => {
    const id = `location-history-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO locationHistory (
        id, driverId, driverName, truckId,
        latitude, longitude, speed, heading,
        altitude, accuracy, timestamp, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.driverId,
      input.driverName || null,
      input.truckId || null,
      input.latitude,
      input.longitude,
      input.speed || null,
      input.heading || null,
      input.altitude || null,
      input.accuracy || null,
      input.timestamp,
      createdAt
    );

    const updateDriver = db.prepare(`
      UPDATE drivers 
      SET lastKnownLatitude = ?,
          lastKnownLongitude = ?,
          lastLocationUpdate = ?
      WHERE id = ?
    `);
    
    updateDriver.run(
      input.latitude,
      input.longitude,
      input.timestamp,
      input.driverId
    );

    return { success: true, id };
  });
