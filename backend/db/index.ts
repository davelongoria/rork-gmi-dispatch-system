import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { 
  sampleDrivers, 
  sampleTrucks, 
  sampleDumpSites, 
  sampleYards, 
  sampleCustomers,
  sampleCommercialRoutes,
  sampleResidentialRoutes,
  sampleResidentialCustomers,
  sampleResidentialStops,
  sampleRecurringJobs
} from '../../utils/sampleData';

const dataDir = join(process.cwd(), 'data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (err) {
  console.error('Error creating data directory:', err);
}

const dbPath = join(dataDir, 'app.db');

export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT,
    password TEXT,
    licenseNumber TEXT,
    licenseExpiry TEXT,
    assignedTruckId TEXT,
    haulingCompanyId TEXT,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    qrToken TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trucks (
    id TEXT PRIMARY KEY,
    unitNumber TEXT NOT NULL,
    vin TEXT,
    licensePlate TEXT,
    odometer INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    billingAddress TEXT,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dumpSites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    acceptedMaterials TEXT NOT NULL,
    hours TEXT,
    contactName TEXT,
    contactPhone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS yards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    customerName TEXT,
    type TEXT NOT NULL,
    containerSize TEXT,
    material TEXT,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    serviceDate TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    routeId TEXT,
    completedAt TEXT,
    completedByDriverId TEXT,
    completionPhotos TEXT,
    completionNotes TEXT,
    suspendedReason TEXT,
    suspendedUntil TEXT,
    willCompleteToday INTEGER,
    suspendedBy TEXT,
    suspendedByDriverName TEXT,
    suspendedDate TEXT,
    suspendedLocation TEXT,
    suspendedNotes TEXT,
    dumpTicketId TEXT,
    dumpSiteId TEXT,
    isDryRun INTEGER,
    dryRunNotes TEXT,
    startMileage INTEGER,
    endMileage INTEGER,
    startedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    driverId TEXT,
    driverName TEXT,
    truckId TEXT,
    truckUnitNumber TEXT,
    yardStartId TEXT,
    dumpSiteEndId TEXT,
    jobIds TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    dispatchedAt TEXT,
    startedAt TEXT,
    completedAt TEXT,
    startMileage INTEGER,
    endMileage INTEGER,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS timeLogs (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    driverName TEXT,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    notes TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dvirs (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    driverName TEXT,
    truckId TEXT NOT NULL,
    truckUnitNumber TEXT,
    type TEXT NOT NULL,
    defects TEXT NOT NULL,
    photos TEXT NOT NULL,
    safeToOperate INTEGER NOT NULL,
    signature TEXT,
    notes TEXT,
    odometer INTEGER,
    state TEXT,
    timestamp TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fuelLogs (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    driverName TEXT,
    truckId TEXT NOT NULL,
    truckUnitNumber TEXT,
    date TEXT NOT NULL,
    odometer INTEGER NOT NULL,
    gallons REAL NOT NULL,
    pricePerGallon REAL NOT NULL,
    totalCost REAL NOT NULL,
    state TEXT,
    receiptPhoto TEXT,
    stationName TEXT,
    stationAddress TEXT,
    latitude REAL,
    longitude REAL,
    notes TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dumpTickets (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    driverName TEXT,
    truckId TEXT NOT NULL,
    truckUnitNumber TEXT,
    dumpSiteId TEXT NOT NULL,
    dumpSiteName TEXT,
    jobId TEXT,
    ticketNumber TEXT,
    date TEXT NOT NULL,
    grossWeight INTEGER,
    tareWeight INTEGER,
    netWeight INTEGER,
    fee REAL,
    ticketPhoto TEXT,
    latitude REAL,
    longitude REAL,
    notes TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    fromUserId TEXT NOT NULL,
    fromUserName TEXT,
    toUserId TEXT NOT NULL,
    toUserName TEXT,
    body TEXT NOT NULL,
    attachments TEXT,
    readAt TEXT,
    timestamp TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gpsBreadcrumbs (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    truckId TEXT NOT NULL,
    routeId TEXT,
    timestamp TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    speed REAL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mileageLogs (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    driverName TEXT,
    truckId TEXT NOT NULL,
    truckUnitNumber TEXT,
    timestamp TEXT NOT NULL,
    odometer INTEGER NOT NULL,
    state TEXT,
    latitude REAL,
    longitude REAL,
    jobId TEXT,
    routeId TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dispatcherSettings (
    id TEXT PRIMARY KEY,
    reportEmail TEXT,
    qrToken TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    startDate TEXT,
    endDate TEXT,
    description TEXT,
    filters TEXT,
    customerId TEXT,
    generatedAt TEXT NOT NULL,
    generatedBy TEXT,
    csvData TEXT,
    entriesCount INTEGER NOT NULL,
    emailedTo TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recurringJobs (
    id TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    customerName TEXT,
    type TEXT NOT NULL,
    containerSize TEXT,
    material TEXT,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    notes TEXT,
    dumpSiteId TEXT,
    projectName TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT NOT NULL,
    primaryColor TEXT NOT NULL,
    secondaryColor TEXT,
    accentColor TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commercialRoutes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    dayOfWeek TEXT NOT NULL,
    scheduledFor TEXT,
    driverId TEXT,
    driverName TEXT,
    truckId TEXT,
    truckUnitNumber TEXT,
    stopIds TEXT NOT NULL,
    routeType TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    dispatchedAt TEXT,
    startedAt TEXT,
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commercialStops (
    id TEXT PRIMARY KEY,
    routeId TEXT NOT NULL,
    companyId TEXT NOT NULL,
    companyName TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    containerSize TEXT,
    serviceType TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    completedAt TEXT,
    notes TEXT,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS residentialCustomers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    serviceDay TEXT NOT NULL,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS residentialRoutes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dayOfWeek TEXT NOT NULL,
    date TEXT NOT NULL,
    driverId TEXT,
    driverName TEXT,
    truckId TEXT,
    truckUnitNumber TEXT,
    customerIds TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'PLANNED',
    routeType TEXT NOT NULL DEFAULT 'RESIDENTIAL_TRASH',
    dispatchedAt TEXT,
    startedAt TEXT,
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS residentialStops (
    id TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    address TEXT NOT NULL,
    serviceDay TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    completedAt TEXT,
    notes TEXT,
    routeId TEXT,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS containerRoutes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    driverId TEXT,
    driverName TEXT,
    truckId TEXT,
    truckUnitNumber TEXT,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    dispatchedAt TEXT,
    startedAt TEXT,
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS containerJobs (
    id TEXT PRIMARY KEY,
    routeId TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    containerType TEXT,
    containerSize TEXT,
    quantity INTEGER,
    customerId TEXT,
    customerName TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    completedAt TEXT,
    notes TEXT,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS locationHistory (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    driverName TEXT,
    truckId TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    speed REAL,
    heading REAL,
    altitude REAL,
    accuracy REAL,
    timestamp TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_routeId ON jobs(routeId);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_routes_driverId ON routes(driverId);
  CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);
  CREATE INDEX IF NOT EXISTS idx_messages_toUserId ON messages(toUserId);
  CREATE INDEX IF NOT EXISTS idx_messages_fromUserId ON messages(fromUserId);
  CREATE INDEX IF NOT EXISTS idx_commercialStops_routeId ON commercialStops(routeId);
  CREATE INDEX IF NOT EXISTS idx_residentialStops_customerId ON residentialStops(customerId);
  CREATE INDEX IF NOT EXISTS idx_residentialStops_routeId ON residentialStops(routeId);
  CREATE INDEX IF NOT EXISTS idx_containerJobs_routeId ON containerJobs(routeId);
  CREATE INDEX IF NOT EXISTS idx_locationHistory_driverId ON locationHistory(driverId);
  CREATE INDEX IF NOT EXISTS idx_locationHistory_timestamp ON locationHistory(timestamp);
`);

const driversCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get() as { count: number };
if (driversCount.count === 0) {
  console.log('Seeding database with sample data...');
  
  const insertDriver = db.prepare(`
    INSERT INTO drivers (id, name, phone, email, username, password, licenseNumber, assignedTruckId, active, qrToken, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const driver of sampleDrivers) {
    insertDriver.run(
      driver.id,
      driver.name,
      driver.phone,
      driver.email,
      driver.username || null,
      driver.password || null,
      driver.licenseNumber || null,
      driver.assignedTruckId || null,
      driver.active ? 1 : 0,
      driver.qrToken || null,
      driver.createdAt
    );
  }
  
  const insertTruck = db.prepare(`
    INSERT INTO trucks (id, unitNumber, vin, licensePlate, odometer, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const truck of sampleTrucks) {
    insertTruck.run(
      truck.id,
      truck.unitNumber,
      truck.vin || null,
      truck.licensePlate || null,
      truck.odometer,
      truck.active ? 1 : 0,
      truck.createdAt
    );
  }
  
  const insertDumpSite = db.prepare(`
    INSERT INTO dumpSites (id, name, address, latitude, longitude, acceptedMaterials, hours, contactName, contactPhone, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const site of sampleDumpSites) {
    insertDumpSite.run(
      site.id,
      site.name,
      site.address,
      site.latitude || null,
      site.longitude || null,
      JSON.stringify(site.acceptedMaterials),
      site.hours || null,
      site.contactName || null,
      site.contactPhone || null,
      site.active ? 1 : 0,
      site.createdAt
    );
  }
  
  const insertYard = db.prepare(`
    INSERT INTO yards (id, name, address, latitude, longitude, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const yard of sampleYards) {
    insertYard.run(
      yard.id,
      yard.name,
      yard.address,
      yard.latitude || null,
      yard.longitude || null,
      yard.active ? 1 : 0,
      yard.createdAt
    );
  }
  
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, address, phone, email, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const customer of sampleCustomers) {
    insertCustomer.run(
      customer.id,
      customer.name,
      customer.address,
      customer.phone || null,
      customer.email || null,
      customer.active ? 1 : 0,
      customer.createdAt
    );
  }
  
  const insertCommercialRoute = db.prepare(`
    INSERT INTO commercialRoutes (id, name, date, dayOfWeek, stopIds, routeType, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const route of sampleCommercialRoutes) {
    insertCommercialRoute.run(
      route.id,
      route.name,
      route.date,
      route.dayOfWeek,
      JSON.stringify(route.stopIds || []),
      route.routeType,
      route.status,
      route.createdAt
    );
  }
  
  const insertResidentialCustomer = db.prepare(`
    INSERT INTO residentialCustomers (id, name, address, phone, serviceDay, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const customer of sampleResidentialCustomers) {
    insertResidentialCustomer.run(
      customer.id,
      customer.name,
      customer.address,
      customer.phone || null,
      customer.serviceDay,
      customer.active ? 1 : 0,
      customer.createdAt
    );
  }
  
  const insertResidentialRoute = db.prepare(`
    INSERT INTO residentialRoutes (id, name, dayOfWeek, date, customerIds, status, routeType, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const route of sampleResidentialRoutes) {
    insertResidentialRoute.run(
      route.id,
      route.name,
      route.dayOfWeek,
      route.date,
      JSON.stringify(route.customerIds || []),
      route.status,
      route.routeType,
      route.createdAt
    );
  }
  
  const insertResidentialStop = db.prepare(`
    INSERT INTO residentialStops (id, customerId, customerName, address, serviceDay, status, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const stop of sampleResidentialStops) {
    insertResidentialStop.run(
      stop.id,
      stop.customerId,
      stop.customerName,
      stop.address,
      stop.serviceDay,
      stop.status,
      stop.active ? 1 : 0,
      stop.createdAt
    );
  }
  
  const insertRecurringJob = db.prepare(`
    INSERT INTO recurringJobs (id, customerId, customerName, type, containerSize, material, address, notes, dumpSiteId, projectName, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const job of sampleRecurringJobs) {
    insertRecurringJob.run(
      job.id,
      job.customerId,
      job.customerName || null,
      job.type,
      job.containerSize || null,
      job.material || null,
      job.address,
      job.notes || null,
      job.dumpSiteId || null,
      job.projectName || null,
      job.createdAt
    );
  }
  
  console.log('Database seeded with sample data successfully!');
}

export default db;
