import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import db from "../../../db/index";

export const syncDataProcedure = publicProcedure
  .input(z.object({
    drivers: z.array(z.any()).optional(),
    trucks: z.array(z.any()).optional(),
    customers: z.array(z.any()).optional(),
    dumpSites: z.array(z.any()).optional(),
    yards: z.array(z.any()).optional(),
    jobs: z.array(z.any()).optional(),
    routes: z.array(z.any()).optional(),
    timeLogs: z.array(z.any()).optional(),
    dvirs: z.array(z.any()).optional(),
    fuelLogs: z.array(z.any()).optional(),
    dumpTickets: z.array(z.any()).optional(),
    messages: z.array(z.any()).optional(),
    gpsBreadcrumbs: z.array(z.any()).optional(),
    mileageLogs: z.array(z.any()).optional(),
    dispatcherSettings: z.any().optional(),
    reports: z.array(z.any()).optional(),
    recurringJobs: z.array(z.any()).optional(),
  }))
  .mutation(async ({ input }) => {
    const now = new Date().toISOString();

    if (input.drivers) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO drivers 
        (id, name, phone, email, username, password, licenseNumber, licenseExpiry, assignedTruckId, haulingCompanyId, notes, active, qrToken, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const driver of input.drivers) {
        stmt.run(
          driver.id, driver.name, driver.phone, driver.email, driver.username || null, driver.password || null,
          driver.licenseNumber || null, driver.licenseExpiry || null, driver.assignedTruckId || null,
          driver.haulingCompanyId || null, driver.notes || null, driver.active ? 1 : 0,
          driver.qrToken || null, driver.createdAt, now
        );
      }
    }

    if (input.trucks) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO trucks 
        (id, unitNumber, vin, licensePlate, odometer, active, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const truck of input.trucks) {
        stmt.run(
          truck.id, truck.unitNumber, truck.vin || null, truck.licensePlate || null,
          truck.odometer || 0, truck.active ? 1 : 0, truck.notes || null, truck.createdAt, now
        );
      }
    }

    if (input.customers) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO customers 
        (id, name, address, phone, email, billingAddress, notes, active, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const customer of input.customers) {
        stmt.run(
          customer.id, customer.name, customer.address, customer.phone || null, customer.email || null,
          customer.billingAddress || null, customer.notes || null, customer.active ? 1 : 0,
          customer.createdAt, now
        );
      }
    }

    if (input.dumpSites) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO dumpSites 
        (id, name, address, latitude, longitude, acceptedMaterials, hours, contactName, contactPhone, active, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const site of input.dumpSites) {
        stmt.run(
          site.id, site.name, site.address, site.latitude || null, site.longitude || null,
          JSON.stringify(site.acceptedMaterials), site.hours || null, site.contactName || null,
          site.contactPhone || null, site.active ? 1 : 0, site.createdAt, now
        );
      }
    }

    if (input.yards) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO yards 
        (id, name, address, latitude, longitude, active, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const yard of input.yards) {
        stmt.run(
          yard.id, yard.name, yard.address, yard.latitude || null, yard.longitude || null,
          yard.active ? 1 : 0, yard.createdAt, now
        );
      }
    }

    if (input.jobs) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO jobs 
        (id, customerId, customerName, type, containerSize, material, address, latitude, longitude, serviceDate, notes, status, routeId, completedAt, completedByDriverId, completionPhotos, completionNotes, suspendedReason, suspendedUntil, willCompleteToday, suspendedBy, suspendedByDriverName, suspendedDate, suspendedLocation, suspendedNotes, dumpTicketId, dumpSiteId, isDryRun, dryRunNotes, startMileage, endMileage, startedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const job of input.jobs) {
        stmt.run(
          job.id, job.customerId, job.customerName || null, job.type, job.containerSize || null,
          job.material || null, job.address, job.latitude || null, job.longitude || null,
          job.serviceDate, job.notes || null, job.status, job.routeId || null,
          job.completedAt || null, job.completedByDriverId || null,
          job.completionPhotos ? JSON.stringify(job.completionPhotos) : null,
          job.completionNotes || null, job.suspendedReason || null, job.suspendedUntil || null,
          job.willCompleteToday ? 1 : null, job.suspendedBy || null,
          job.suspendedByDriverName || null, job.suspendedDate || null,
          job.suspendedLocation || null, job.suspendedNotes || null,
          job.dumpTicketId || null, job.dumpSiteId || null,
          job.isDryRun ? 1 : null, job.dryRunNotes || null,
          job.startMileage || null, job.endMileage || null, job.startedAt || null,
          job.createdAt, now
        );
      }
    }

    if (input.routes) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO routes 
        (id, date, driverId, driverName, truckId, truckUnitNumber, yardStartId, dumpSiteEndId, jobIds, status, dispatchedAt, startedAt, completedAt, startMileage, endMileage, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const route of input.routes) {
        stmt.run(
          route.id, route.date, route.driverId || null, route.driverName || null,
          route.truckId || null, route.truckUnitNumber || null,
          route.yardStartId || null, route.dumpSiteEndId || null,
          JSON.stringify(route.jobIds), route.status,
          route.dispatchedAt || null, route.startedAt || null, route.completedAt || null,
          route.startMileage || null, route.endMileage || null,
          route.createdAt, now
        );
      }
    }

    if (input.timeLogs) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO timeLogs 
        (id, driverId, driverName, type, timestamp, latitude, longitude, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const log of input.timeLogs) {
        stmt.run(
          log.id, log.driverId, log.driverName || null, log.type, log.timestamp,
          log.latitude || null, log.longitude || null, log.notes || null, log.createdAt
        );
      }
    }

    if (input.dvirs) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO dvirs 
        (id, driverId, driverName, truckId, truckUnitNumber, type, defects, photos, safeToOperate, signature, notes, odometer, state, timestamp, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const dvir of input.dvirs) {
        stmt.run(
          dvir.id, dvir.driverId, dvir.driverName || null, dvir.truckId,
          dvir.truckUnitNumber || null, dvir.type,
          JSON.stringify(dvir.defects), JSON.stringify(dvir.photos),
          dvir.safeToOperate ? 1 : 0, dvir.signature || null, dvir.notes || null,
          dvir.odometer || null, dvir.state || null, dvir.timestamp, dvir.createdAt
        );
      }
    }

    if (input.fuelLogs) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO fuelLogs 
        (id, driverId, driverName, truckId, truckUnitNumber, date, odometer, gallons, pricePerGallon, totalCost, state, receiptPhoto, stationName, stationAddress, latitude, longitude, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const log of input.fuelLogs) {
        stmt.run(
          log.id, log.driverId, log.driverName || null, log.truckId,
          log.truckUnitNumber || null, log.date, log.odometer,
          log.gallons, log.pricePerGallon, log.totalCost,
          log.state || null, log.receiptPhoto || null,
          log.stationName || null, log.stationAddress || null,
          log.latitude || null, log.longitude || null, log.notes || null, log.createdAt
        );
      }
    }

    if (input.dumpTickets) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO dumpTickets 
        (id, driverId, driverName, truckId, truckUnitNumber, dumpSiteId, dumpSiteName, jobId, ticketNumber, date, grossWeight, tareWeight, netWeight, fee, ticketPhoto, latitude, longitude, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const ticket of input.dumpTickets) {
        stmt.run(
          ticket.id, ticket.driverId, ticket.driverName || null, ticket.truckId,
          ticket.truckUnitNumber || null, ticket.dumpSiteId, ticket.dumpSiteName || null,
          ticket.jobId || null, ticket.ticketNumber || null, ticket.date,
          ticket.grossWeight || null, ticket.tareWeight || null, ticket.netWeight || null,
          ticket.fee || null, ticket.ticketPhoto || null,
          ticket.latitude || null, ticket.longitude || null, ticket.notes || null, ticket.createdAt
        );
      }
    }

    if (input.messages) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO messages 
        (id, fromUserId, fromUserName, toUserId, toUserName, body, attachments, readAt, timestamp, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const msg of input.messages) {
        stmt.run(
          msg.id, msg.fromUserId, msg.fromUserName || null, msg.toUserId,
          msg.toUserName || null, msg.body,
          msg.attachments ? JSON.stringify(msg.attachments) : null,
          msg.readAt || null, msg.timestamp, msg.createdAt
        );
      }
    }

    if (input.gpsBreadcrumbs) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO gpsBreadcrumbs 
        (id, driverId, truckId, routeId, timestamp, latitude, longitude, speed, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const crumb of input.gpsBreadcrumbs) {
        stmt.run(
          crumb.id, crumb.driverId, crumb.truckId, crumb.routeId || null,
          crumb.timestamp, crumb.latitude, crumb.longitude,
          crumb.speed || null, crumb.createdAt
        );
      }
    }

    if (input.mileageLogs) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO mileageLogs 
        (id, driverId, driverName, truckId, truckUnitNumber, timestamp, odometer, state, latitude, longitude, jobId, routeId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const log of input.mileageLogs) {
        stmt.run(
          log.id, log.driverId, log.driverName || null, log.truckId,
          log.truckUnitNumber || null, log.timestamp, log.odometer,
          log.state || null, log.latitude || null, log.longitude || null,
          log.jobId || null, log.routeId || null, log.createdAt
        );
      }
    }

    if (input.dispatcherSettings) {
      const settings = input.dispatcherSettings;
      db.prepare(`
        INSERT OR REPLACE INTO dispatcherSettings 
        (id, reportEmail, qrToken, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        settings.id, settings.reportEmail || null, settings.qrToken || null,
        settings.createdAt, now
      );
    }

    if (input.reports) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO reports 
        (id, name, type, startDate, endDate, description, filters, customerId, generatedAt, generatedBy, csvData, entriesCount, emailedTo, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const report of input.reports) {
        stmt.run(
          report.id, report.name, report.type, report.startDate || null,
          report.endDate || null, report.description || null,
          report.filters ? JSON.stringify(report.filters) : null,
          report.customerId || null, report.generatedAt, report.generatedBy || null,
          report.csvData || null, report.entriesCount,
          report.emailedTo ? JSON.stringify(report.emailedTo) : null,
          report.createdAt
        );
      }
    }

    if (input.recurringJobs) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO recurringJobs 
        (id, customerId, customerName, type, containerSize, material, address, latitude, longitude, notes, dumpSiteId, projectName, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const job of input.recurringJobs) {
        stmt.run(
          job.id, job.customerId, job.customerName || null, job.type,
          job.containerSize || null, job.material || null, job.address,
          job.latitude || null, job.longitude || null, job.notes || null,
          job.dumpSiteId || null, job.projectName || null,
          job.createdAt, now
        );
      }
    }

    return { success: true };
  });
