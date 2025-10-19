export type UserRole = 'DISPATCHER' | 'DRIVER' | 'MANAGER';

export type JobType = 'DELIVER' | 'PICKUP' | 'SWITCH' | 'ROUND_TRIP';
export type JobStatus = 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'AT_DUMP' | 'SUSPENDED' | 'COMPLETED';
export type RouteStatus = 'PLANNED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
export type TimeLogType = 'CLOCK_IN' | 'CLOCK_OUT' | 'LUNCH_START' | 'LUNCH_END';
export type DVIRType = 'PRE_TRIP' | 'POST_TRIP';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  username?: string;
  password?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  assignedTruckId?: string;
  haulingCompanyId?: string;
  notes?: string;
  active: boolean;
  qrToken?: string;
  createdAt: string;
}

export interface Truck {
  id: string;
  unitNumber: string;
  vin?: string;
  licensePlate?: string;
  odometer: number;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface DumpSite {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  acceptedMaterials: string[];
  hours?: string;
  contactName?: string;
  contactPhone?: string;
  active: boolean;
  createdAt: string;
}

export interface Yard {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  customerId: string;
  customerName?: string;
  type: JobType;
  containerSize?: string;
  material?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  serviceDate: string;
  notes?: string;
  status: JobStatus;
  routeId?: string;
  completedAt?: string;
  completedByDriverId?: string;
  completionPhotos?: string[];
  completionNotes?: string;
  suspendedReason?: string;
  suspendedUntil?: string;
  willCompleteToday?: boolean;
  suspendedBy?: string;
  suspendedByDriverName?: string;
  suspendedDate?: string;
  suspendedLocation?: string;
  suspendedNotes?: string;
  dumpTicketId?: string;
  dumpSiteId?: string;
  isDryRun?: boolean;
  dryRunNotes?: string;
  startMileage?: number;
  endMileage?: number;
  startedAt?: string;
  createdAt: string;
}

export interface Route {
  id: string;
  date: string;
  driverId?: string;
  driverName?: string;
  truckId?: string;
  truckUnitNumber?: string;
  yardStartId?: string;
  dumpSiteEndId?: string;
  jobIds: string[];
  status: RouteStatus;
  dispatchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  startMileage?: number;
  endMileage?: number;
  createdAt: string;
}

export interface TimeLog {
  id: string;
  driverId: string;
  driverName?: string;
  type: TimeLogType;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
}

export interface DVIRDefect {
  component: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DVIR {
  id: string;
  driverId: string;
  driverName?: string;
  truckId: string;
  truckUnitNumber?: string;
  type: DVIRType;
  defects: DVIRDefect[];
  photos: string[];
  safeToOperate: boolean;
  signature?: string;
  notes?: string;
  odometer?: number;
  state?: string;
  timestamp: string;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  driverId: string;
  driverName?: string;
  truckId: string;
  truckUnitNumber?: string;
  date: string;
  odometer: number;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  state?: string;
  receiptPhoto?: string;
  stationName?: string;
  stationAddress?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
}

export interface DumpTicket {
  id: string;
  driverId: string;
  driverName?: string;
  truckId: string;
  truckUnitNumber?: string;
  dumpSiteId: string;
  dumpSiteName?: string;
  jobId?: string;
  ticketNumber?: string;
  date: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  fee?: number;
  ticketPhoto?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
}

export interface MileageLog {
  id: string;
  driverId: string;
  driverName?: string;
  truckId: string;
  truckUnitNumber?: string;
  timestamp: string;
  odometer: number;
  state?: string;
  latitude?: number;
  longitude?: number;
  jobId?: string;
  routeId?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  toUserName?: string;
  body: string;
  attachments?: string[];
  readAt?: string;
  timestamp: string;
  createdAt: string;
}

export interface GPSBreadcrumb {
  id: string;
  driverId: string;
  truckId: string;
  routeId?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed?: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  timestamp: string;
}

export interface DispatcherSettings {
  id: string;
  reportEmail?: string;
  qrToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'FUEL' | 'DUMP_TICKET' | 'DVIR' | 'TIME' | 'MILEAGE' | 'DAILY' | 'CUSTOMER' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  description?: string;
  filters?: Record<string, any>;
  customerId?: string;
  generatedAt: string;
  generatedBy?: string;
  csvData?: string;
  entriesCount: number;
  emailedTo?: string[];
  createdAt: string;
}

export interface RecurringJob {
  id: string;
  customerId: string;
  customerName?: string;
  type: JobType;
  containerSize?: string;
  material?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  dumpSiteId?: string;
  projectName?: string;
  createdAt: string;
}

export type RouteType = 'DUMP_TRUCK' | 'COMMERCIAL_FRONTLOAD';
export type ServiceFrequency = 'ONCE_WEEK' | 'TWICE_WEEK' | 'THREE_WEEK' | 'FOUR_WEEK' | 'FIVE_WEEK' | 'SIX_WEEK' | 'SEVEN_WEEK' | 'EIGHT_WEEK' | 'NINE_WEEK' | 'TEN_WEEK' | 'BIWEEKLY' | 'EVERY_OTHER_WEEK' | 'MONTHLY' | 'ON_CALL';
export type StopStatus = 'PENDING' | 'COMPLETED' | 'NOT_OUT' | 'BLOCKED' | 'SKIPPED';
export type ContainerSize = '1' | '1.5' | '2' | '4' | '6' | '8' | 'COMPACTOR';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface StopHistoryEntry {
  id: string;
  timestamp: string;
  driverId?: string;
  driverName?: string;
  status: StopStatus;
  notes?: string;
  photos?: string[];
}

export interface StopRouteAssignment {
  dayOfWeek: DayOfWeek;
  routeId: string;
  routeName: string;
}

export interface CommercialStop {
  id: string;
  jobName: string;
  customerId?: string;
  customerName?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  containerSize: ContainerSize;
  containerCount: number;
  serviceFrequency: ServiceFrequency;
  serviceDays: DayOfWeek[];
  routeAssignments?: StopRouteAssignment[];
  specialInstructions?: string;
  status: StopStatus;
  completedAt?: string;
  completedByDriverId?: string;
  completionPhotos?: string[];
  issuePhotos?: string[];
  issueNotes?: string;
  notOutReason?: string;
  blockedReason?: string;
  history?: StopHistoryEntry[];
  active: boolean;
  createdAt: string;
}

export interface CommercialRoute {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  scheduledFor?: string;
  date: string;
  driverId?: string;
  driverName?: string;
  truckId?: string;
  truckUnitNumber?: string;
  stopIds: string[];
  status: RouteStatus;
  routeType: 'COMMERCIAL_FRONTLOAD';
  dispatchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  startMileage?: number;
  endMileage?: number;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  active: boolean;
  createdAt: string;
}

export interface ResidentialCustomer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  serviceDay: DayOfWeek;
  serviceFrequency: 'ONCE_WEEK' | 'EVERY_OTHER_WEEK';
  weekOffset?: number;
  notes?: string;
  active: boolean;
  routeId?: string;
  routeName?: string;
  createdAt: string;
}

export interface ResidentialStop {
  id: string;
  customerId: string;
  customerName?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  serviceDay: DayOfWeek;
  status: StopStatus;
  notOutPhoto?: string;
  notOutTimestamp?: string;
  notOutNotes?: string;
  completedAt?: string;
  completedByDriverId?: string;
  history?: StopHistoryEntry[];
  active: boolean;
  createdAt: string;
}

export interface ResidentialRoute {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  date: string;
  driverId?: string;
  driverName?: string;
  truckId?: string;
  truckUnitNumber?: string;
  customerIds: string[];
  status: RouteStatus;
  routeType: 'RESIDENTIAL_TRASH';
  dispatchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  startMileage?: number;
  endMileage?: number;
  holidayShiftDays?: number;
  createdAt: string;
}

export type ContainerJobType = 'TOTER_DELIVERY' | 'COMM_CONTAINER_DELIVERY' | 'CONTAINER_PICKUP' | 'TOTER_PICKUP' | 'MISSED_PICKUP' | 'EXTRA_PICKUP';

export interface ContainerJob {
  id: string;
  type: ContainerJobType;
  address: string;
  customerId?: string;
  customerName?: string;
  latitude?: number;
  longitude?: number;
  containerType?: ContainerSize | 'TOTER';
  containerCount?: number;
  notes?: string;
  status: StopStatus;
  completedAt?: string;
  completedByDriverId?: string;
  completionPhotos?: string[];
  completionNotes?: string;
  issuePhotos?: string[];
  issueNotes?: string;
  history?: StopHistoryEntry[];
  createdAt: string;
}

export interface ContainerRoute {
  id: string;
  name: string;
  date: string;
  driverId?: string;
  driverName?: string;
  truckId?: string;
  truckUnitNumber?: string;
  jobIds: string[];
  status: RouteStatus;
  routeType: 'CONTAINER_DELIVERY';
  dispatchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  startMileage?: number;
  endMileage?: number;
  createdAt: string;
}
