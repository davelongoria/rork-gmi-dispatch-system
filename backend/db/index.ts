import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'app.db');

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

  CREATE INDEX IF NOT EXISTS idx_jobs_routeId ON jobs(routeId);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_routes_driverId ON routes(driverId);
  CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);
  CREATE INDEX IF NOT EXISTS idx_messages_toUserId ON messages(toUserId);
  CREATE INDEX IF NOT EXISTS idx_messages_fromUserId ON messages(fromUserId);
`);

console.log('Database initialized successfully');

export default db;
