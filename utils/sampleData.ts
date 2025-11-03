import type { Driver, Truck, DumpSite, Yard, Customer, CommercialRoute, ResidentialRoute, ContainerRoute, ResidentialCustomer, ResidentialStop, RecurringJob } from '@/types';

export const sampleDrivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'Jeremy C.',
    phone: '555-0101',
    email: 'jerm@gmi.com',
    username: 'jerm',
    password: 'jerm',
    licenseNumber: 'DL123456',
    assignedTruckId: 'truck-1',
    haulingCompanyId: 'region',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-2',
    name: 'Kevin S.',
    phone: '555-0102',
    email: 'kevin@region.com',
    username: 'Kevin',
    password: 'kevin',
    licenseNumber: 'DL789012',
    assignedTruckId: 'truck-2',
    haulingCompanyId: 'region',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-3',
    name: 'John S.',
    phone: '555-0103',
    email: 'john@gmi.com',
    username: 'John',
    password: 'john',
    licenseNumber: 'DL345678',
    assignedTruckId: 'truck-3',
    haulingCompanyId: 'gmi',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-4',
    name: 'Bobby C.',
    phone: '555-0104',
    email: 'bobby@gmi.com',
    username: 'Bobby',
    password: 'bobby',
    licenseNumber: 'DL456789',
    assignedTruckId: 'truck-4',
    haulingCompanyId: 'gmi',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-5',
    name: 'Sammy W.',
    phone: '555-0105',
    email: 'sammy@gmi.com',
    username: 'Sammy',
    password: 'sammy',
    licenseNumber: 'DL567890',
    assignedTruckId: 'truck-5',
    haulingCompanyId: 'gmi',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-6',
    name: 'Dave O.',
    phone: '555-0106',
    email: 'dave@region.com',
    username: 'Dave',
    password: 'dave',
    licenseNumber: 'DL678901',
    assignedTruckId: 'truck-6',
    haulingCompanyId: 'region',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleTrucks: Truck[] = [
  {
    id: 'truck-1',
    unitNumber: '100',
    vin: '1HGBH41JXMN109186',
    licensePlate: 'REG-100',
    odometer: 45230,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'truck-2',
    unitNumber: '200',
    vin: '2HGBH41JXMN109187',
    licensePlate: 'REG-200',
    odometer: 38450,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'truck-3',
    unitNumber: '205',
    vin: '3HGBH41JXMN109188',
    licensePlate: 'GMI-205',
    odometer: 52100,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'truck-4',
    unitNumber: '203',
    vin: '4HGBH41JXMN109189',
    licensePlate: 'GMI-203',
    odometer: 48300,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'truck-5',
    unitNumber: '208',
    vin: '5HGBH41JXMN109190',
    licensePlate: 'GMI-208',
    odometer: 41200,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'truck-6',
    unitNumber: '400',
    vin: '6HGBH41JXMN109191',
    licensePlate: 'REG-400',
    odometer: 35800,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleDumpSites: DumpSite[] = [
  {
    id: 'dump-1',
    name: 'Cottage Grove Transfer Station',
    address: '1703 Cottage Grove, Ford Heights, IL 60411',
    latitude: 41.5053,
    longitude: -87.5972,
    acceptedMaterials: ['Construction Debris', 'General Waste', 'Metal', 'Recyclables', 'Yard Waste', 'Wood'],
    hours: 'Mon-Sat 6AM-6PM',
    contactName: 'Station Manager',
    contactPhone: '555-0200',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleYards: Yard[] = [
  {
    id: 'yard-1',
    name: 'GMI Home Base',
    address: '1703 Cottage Grove, Ford Heights, IL 60411',
    latitude: 41.5053,
    longitude: -87.5972,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleCustomers: Customer[] = [
  {
    id: 'customer-1',
    name: 'Cronimet Chicago',
    address: '10602 S Buffalo Avenue, Chicago, IL 60617-2907',
    phone: '(773) 933-2900',
    email: 'contact@crominet.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-2',
    name: 'Knickerbocker Roofing & Paving Co., Inc',
    address: '16851 S Lathrop Ave, Harvey, IL 60426',
    phone: '(708) 339-7260',
    email: 'info@knickroof.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-3',
    name: 'Armour Construction',
    address: '208 Washington St, Valparaiso, IN 46383',
    phone: '(219) 987-2023',
    email: 'info@armourconstruction.net',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-4',
    name: 'ACMS',
    address: '809 McCool Rd, Valparaiso, IN 46385',
    phone: '(219) 662-2380',
    email: 'info@acmsgroup.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-5',
    name: 'TML Deals',
    address: '1503 N Main St, Crown Point, IN 46307',
    phone: '(219) 555-0305',
    email: 'info@tmldeals.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-6',
    name: 'USS Steel Gary IN',
    address: '1 N Broadway, Gary, IN 46402',
    phone: '(219) 977-0300',
    email: 'contact@uss.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-7',
    name: 'Dyer Construction Company Inc',
    address: '1716 Sheffield Ave, Dyer, IN 46311',
    phone: '(219) 865-2961',
    email: 'info@dyerconstruction.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-8',
    name: 'Allen Brothers',
    address: '3737 S Halsted St, Chicago, IL 60609',
    phone: '(312) 285-5000',
    email: 'info@allenbrothers.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-9',
    name: 'Adriatic Steel Company Inc',
    address: '3630 Calumet Ave, Hammond, IN 46320',
    phone: '(219) 933-9332',
    email: 'contact@adriaticsteel.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-10',
    name: 'Brookfield Resource Management',
    address: '171 E 12th St, Chicago Heights, IL 60411-2701',
    phone: '(708) 754-5329',
    email: 'info@brookfieldiron.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-11',
    name: 'Gluth Brothers Roofing Company Inc',
    address: '6701 Osborn Ave, Hammond, IN 46323',
    phone: '(219) 844-5536',
    email: 'contact@gluthbrothersroofing.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleCommercialRoutes: CommercialRoute[] = [
  {
    id: 'comm-route-mon',
    name: 'MONFL1',
    dayOfWeek: 'MONDAY',
    date: new Date().toISOString(),
    stopIds: [],
    status: 'PLANNED',
    routeType: 'COMMERCIAL_FRONTLOAD',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm-route-tue',
    name: 'TuesFL1',
    dayOfWeek: 'TUESDAY',
    date: new Date().toISOString(),
    stopIds: [],
    status: 'PLANNED',
    routeType: 'COMMERCIAL_FRONTLOAD',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm-route-wed',
    name: 'WedFL1',
    dayOfWeek: 'WEDNESDAY',
    date: new Date().toISOString(),
    stopIds: [],
    status: 'PLANNED',
    routeType: 'COMMERCIAL_FRONTLOAD',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm-route-thu',
    name: 'ThursFL1',
    dayOfWeek: 'THURSDAY',
    date: new Date().toISOString(),
    stopIds: [],
    status: 'PLANNED',
    routeType: 'COMMERCIAL_FRONTLOAD',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm-route-fri',
    name: 'FriFL1',
    dayOfWeek: 'FRIDAY',
    date: new Date().toISOString(),
    stopIds: [],
    status: 'PLANNED',
    routeType: 'COMMERCIAL_FRONTLOAD',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm-route-sat',
    name: 'SatFL1',
    dayOfWeek: 'SATURDAY',
    date: new Date().toISOString(),
    stopIds: [],
    status: 'PLANNED',
    routeType: 'COMMERCIAL_FRONTLOAD',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm-route-sun',
    name: 'SunFL1',
    dayOfWeek: 'SUNDAY',
    date: new Date().toISOString(),
    stopIds: [],
    status: 'PLANNED',
    routeType: 'COMMERCIAL_FRONTLOAD',
    createdAt: new Date().toISOString(),
  },
];

const streets = [
  'Oak Street', 'Maple Avenue', 'Elm Drive', 'Pine Lane', 'Cedar Court',
  'Birch Road', 'Willow Way', 'Spruce Street', 'Ash Boulevard', 'Hickory Place',
  'Walnut Circle', 'Cherry Lane', 'Poplar Drive', 'Magnolia Avenue', 'Dogwood Court',
  'Redwood Road', 'Sycamore Street', 'Juniper Way', 'Cypress Drive', 'Beech Avenue'
];

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson'
];

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

export const sampleResidentialCustomers: ResidentialCustomer[] = [];
export const sampleResidentialStops: ResidentialStop[] = [];

for (let i = 0; i < 70; i++) {
  const dayIndex = Math.floor(i / 10);
  const serviceDay = daysOfWeek[dayIndex];
  const streetNum = 100 + (i * 10);
  const street = streets[i % streets.length];
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const address = `${streetNum} ${street}, City, FL 12345`;
  
  const customer: ResidentialCustomer = {
    id: `resi-customer-${i + 1}`,
    name,
    address,
    phone: `555-${String(1000 + i).padStart(4, '0')}`,
    serviceDay,
    serviceFrequency: 'ONCE_WEEK',
    active: true,
    createdAt: new Date().toISOString(),
  };
  
  const stop: ResidentialStop = {
    id: `resi-stop-${i + 1}`,
    customerId: customer.id,
    customerName: name,
    address,
    serviceDay,
    status: 'PENDING',
    active: true,
    createdAt: new Date().toISOString(),
  };
  
  sampleResidentialCustomers.push(customer);
  sampleResidentialStops.push(stop);
}

export const sampleResidentialRoutes: ResidentialRoute[] = [
  {
    id: 'resi-route-mon',
    name: 'Monday Residential',
    dayOfWeek: 'MONDAY',
    date: new Date().toISOString(),
    customerIds: sampleResidentialStops.filter(s => s.serviceDay === 'MONDAY').map(s => s.customerId),
    status: 'PLANNED',
    routeType: 'RESIDENTIAL_TRASH',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'resi-route-tue',
    name: 'Tuesday Residential',
    dayOfWeek: 'TUESDAY',
    date: new Date().toISOString(),
    customerIds: sampleResidentialStops.filter(s => s.serviceDay === 'TUESDAY').map(s => s.customerId),
    status: 'PLANNED',
    routeType: 'RESIDENTIAL_TRASH',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'resi-route-wed',
    name: 'Wednesday Residential',
    dayOfWeek: 'WEDNESDAY',
    date: new Date().toISOString(),
    customerIds: sampleResidentialStops.filter(s => s.serviceDay === 'WEDNESDAY').map(s => s.customerId),
    status: 'PLANNED',
    routeType: 'RESIDENTIAL_TRASH',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'resi-route-thu',
    name: 'Thursday Residential',
    dayOfWeek: 'THURSDAY',
    date: new Date().toISOString(),
    customerIds: sampleResidentialStops.filter(s => s.serviceDay === 'THURSDAY').map(s => s.customerId),
    status: 'PLANNED',
    routeType: 'RESIDENTIAL_TRASH',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'resi-route-fri',
    name: 'Friday Residential',
    dayOfWeek: 'FRIDAY',
    date: new Date().toISOString(),
    customerIds: sampleResidentialStops.filter(s => s.serviceDay === 'FRIDAY').map(s => s.customerId),
    status: 'PLANNED',
    routeType: 'RESIDENTIAL_TRASH',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'resi-route-sat',
    name: 'Saturday Residential',
    dayOfWeek: 'SATURDAY',
    date: new Date().toISOString(),
    customerIds: sampleResidentialStops.filter(s => s.serviceDay === 'SATURDAY').map(s => s.customerId),
    status: 'PLANNED',
    routeType: 'RESIDENTIAL_TRASH',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'resi-route-sun',
    name: 'Sunday Residential',
    dayOfWeek: 'SUNDAY',
    date: new Date().toISOString(),
    customerIds: sampleResidentialStops.filter(s => s.serviceDay === 'SUNDAY').map(s => s.customerId),
    status: 'PLANNED',
    routeType: 'RESIDENTIAL_TRASH',
    createdAt: new Date().toISOString(),
  },
];

export const sampleContainerRoutes: ContainerRoute[] = [
  {
    id: 'cont-route-1',
    name: 'Container Route 1',
    date: new Date().toISOString(),
    jobIds: [],
    status: 'PLANNED',
    routeType: 'CONTAINER_DELIVERY',
    createdAt: new Date().toISOString(),
  },
];

export const sampleRecurringJobs: RecurringJob[] = [
  {
    id: 'recurring-1',
    customerId: 'customer-4',
    customerName: 'ACMS',
    type: 'DELIVER',
    containerSize: '30 Yard',
    material: 'Construction Debris',
    address: '809 McCool Rd, Valparaiso, IN 46385',
    latitude: 41.4634,
    longitude: -87.0611,
    notes: 'Gate code: 1234. Call before arrival.',
    dumpSiteId: 'dump-1',
    projectName: 'ACMS Rolloff',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'recurring-2',
    customerId: 'customer-6',
    customerName: 'USS Steel Gary IN',
    type: 'SWITCH',
    containerSize: '40 Yard',
    material: 'Metal Scrap',
    address: '1 N Broadway, Gary, IN 46402',
    latitude: 41.5900,
    longitude: -87.3439,
    notes: 'Weekly switch required. Contact foreman on site.',
    dumpSiteId: 'dump-1',
    projectName: 'USS Steel Rolloff',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'recurring-3',
    customerId: 'customer-8',
    customerName: 'Allen Brothers',
    type: 'PICKUP',
    containerSize: '20 Yard',
    material: 'General Waste',
    address: '3737 S Halsted St, Chicago, IL 60609',
    latitude: 41.8258,
    longitude: -87.6469,
    notes: 'Weekly pickup. Container located at rear dock.',
    dumpSiteId: 'dump-1',
    projectName: 'Allen Brothers Rolloff',
    createdAt: new Date().toISOString(),
  },
];
