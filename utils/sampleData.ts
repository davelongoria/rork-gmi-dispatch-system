import type { Driver, Truck, DumpSite, Yard, Customer, CommercialRoute, ResidentialRoute, ContainerRoute, ResidentialCustomer, ResidentialStop } from '@/types';

export const sampleDrivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'Mike Driver',
    phone: '555-0101',
    email: 'driver@gmi.com',
    licenseNumber: 'DL123456',
    assignedTruckId: 'truck-1',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-2',
    name: 'Sarah Johnson',
    phone: '555-0102',
    email: 'sarah.johnson@gmi.com',
    licenseNumber: 'DL789012',
    assignedTruckId: 'truck-2',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-3',
    name: 'Tom Martinez',
    phone: '555-0103',
    email: 'tom.martinez@gmi.com',
    licenseNumber: 'DL345678',
    assignedTruckId: 'truck-3',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleTrucks: Truck[] = [
  {
    id: 'truck-1',
    unitNumber: 'T-101',
    vin: '1HGBH41JXMN109186',
    licensePlate: 'GMI-101',
    odometer: 45230,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'truck-2',
    unitNumber: 'T-102',
    vin: '2HGBH41JXMN109187',
    licensePlate: 'GMI-102',
    odometer: 38450,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'truck-3',
    unitNumber: 'T-103',
    vin: '3HGBH41JXMN109188',
    licensePlate: 'GMI-103',
    odometer: 52100,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleDumpSites: DumpSite[] = [
  {
    id: 'dump-1',
    name: 'Central Landfill',
    address: '1234 Waste Management Rd, City, ST 12345',
    latitude: 37.7749,
    longitude: -122.4194,
    acceptedMaterials: ['Construction Debris', 'General Waste', 'Metal'],
    hours: 'Mon-Sat 6AM-6PM',
    contactName: 'John Smith',
    contactPhone: '555-0200',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dump-2',
    name: 'North Transfer Station',
    address: '5678 Industrial Blvd, City, ST 12346',
    latitude: 37.8044,
    longitude: -122.2712,
    acceptedMaterials: ['Recyclables', 'Yard Waste', 'Wood'],
    hours: 'Mon-Fri 7AM-5PM',
    contactName: 'Jane Doe',
    contactPhone: '555-0201',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleYards: Yard[] = [
  {
    id: 'yard-1',
    name: 'GMI Main Yard',
    address: '100 GMI Services Way, City, ST 12340',
    latitude: 37.7849,
    longitude: -122.4094,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const sampleCustomers: Customer[] = [
  {
    id: 'customer-1',
    name: 'ABC Construction',
    address: '789 Builder St, City, ST 12347',
    phone: '555-0300',
    email: 'contact@abcconstruction.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-2',
    name: 'XYZ Demolition',
    address: '321 Demo Ave, City, ST 12348',
    phone: '555-0301',
    email: 'info@xyzdemolition.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-3',
    name: 'City Municipal Services',
    address: '456 Government Plaza, City, ST 12349',
    phone: '555-0302',
    email: 'services@citymunicpal.gov',
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
