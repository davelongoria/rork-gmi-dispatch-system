import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db";

export const getAllDataProcedure = publicProcedure.query(() => {
  const drivers = db.prepare('SELECT * FROM drivers').all();
  const trucks = db.prepare('SELECT * FROM trucks').all();
  const customers = db.prepare('SELECT * FROM customers').all();
  const dumpSites = db.prepare('SELECT * FROM dumpSites').all();
  const yards = db.prepare('SELECT * FROM yards').all();
  const jobs = db.prepare('SELECT * FROM jobs').all();
  const routes = db.prepare('SELECT * FROM routes').all();
  const timeLogs = db.prepare('SELECT * FROM timeLogs').all();
  const dvirs = db.prepare('SELECT * FROM dvirs').all();
  const fuelLogs = db.prepare('SELECT * FROM fuelLogs').all();
  const dumpTickets = db.prepare('SELECT * FROM dumpTickets').all();
  const messages = db.prepare('SELECT * FROM messages').all();
  const gpsBreadcrumbs = db.prepare('SELECT * FROM gpsBreadcrumbs').all();
  const mileageLogs = db.prepare('SELECT * FROM mileageLogs').all();
  const dispatcherSettingsRow = db.prepare('SELECT * FROM dispatcherSettings LIMIT 1').get();
  const reports = db.prepare('SELECT * FROM reports').all();
  const recurringJobs = db.prepare('SELECT * FROM recurringJobs').all();

  return {
    drivers: drivers.map((d: any) => ({
      ...d,
      active: d.active === 1,
    })),
    trucks: trucks.map((t: any) => ({
      ...t,
      active: t.active === 1,
    })),
    customers: customers.map((c: any) => ({
      ...c,
      active: c.active === 1,
    })),
    dumpSites: dumpSites.map((d: any) => ({
      ...d,
      acceptedMaterials: JSON.parse(d.acceptedMaterials || '[]'),
      active: d.active === 1,
    })),
    yards: yards.map((y: any) => ({
      ...y,
      active: y.active === 1,
    })),
    jobs: jobs.map((j: any) => ({
      ...j,
      completionPhotos: j.completionPhotos ? JSON.parse(j.completionPhotos) : undefined,
      willCompleteToday: j.willCompleteToday === 1,
      isDryRun: j.isDryRun === 1,
    })),
    routes: routes.map((r: any) => ({
      ...r,
      jobIds: JSON.parse(r.jobIds || '[]'),
    })),
    timeLogs,
    dvirs: dvirs.map((d: any) => ({
      ...d,
      defects: JSON.parse(d.defects || '[]'),
      photos: JSON.parse(d.photos || '[]'),
      safeToOperate: d.safeToOperate === 1,
    })),
    fuelLogs,
    dumpTickets,
    messages: messages.map((m: any) => ({
      ...m,
      attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
    })),
    gpsBreadcrumbs,
    mileageLogs,
    dispatcherSettings: dispatcherSettingsRow || null,
    reports: reports.map((r: any) => ({
      ...r,
      filters: r.filters ? JSON.parse(r.filters) : undefined,
      emailedTo: r.emailedTo ? JSON.parse(r.emailedTo) : undefined,
    })),
    recurringJobs,
  };
});
