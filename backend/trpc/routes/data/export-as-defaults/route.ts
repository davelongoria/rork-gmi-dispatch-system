import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/backend/db";
import { writeFileSync } from "fs";
import { join } from "path";

export const exportAsDefaultsProcedure = publicProcedure.mutation(() => {
  const drivers = db.prepare('SELECT * FROM drivers').all();
  const trucks = db.prepare('SELECT * FROM trucks').all();
  const dumpSites = db.prepare('SELECT * FROM dumpSites').all();
  const yards = db.prepare('SELECT * FROM yards').all();
  const customers = db.prepare('SELECT * FROM customers').all();

  const formattedDrivers = drivers.map((d: any) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email,
    username: d.username || undefined,
    password: d.password || undefined,
    licenseNumber: d.licenseNumber || undefined,
    licenseExpiry: d.licenseExpiry || undefined,
    assignedTruckId: d.assignedTruckId || undefined,
    haulingCompanyId: d.haulingCompanyId || undefined,
    notes: d.notes || undefined,
    active: d.active === 1,
    qrToken: d.qrToken || undefined,
    createdAt: d.createdAt,
  }));

  const formattedTrucks = trucks.map((t: any) => ({
    id: t.id,
    unitNumber: t.unitNumber,
    vin: t.vin || undefined,
    licensePlate: t.licensePlate || undefined,
    odometer: t.odometer,
    active: t.active === 1,
    notes: t.notes || undefined,
    createdAt: t.createdAt,
  }));

  const formattedDumpSites = dumpSites.map((d: any) => ({
    id: d.id,
    name: d.name,
    address: d.address,
    latitude: d.latitude || undefined,
    longitude: d.longitude || undefined,
    acceptedMaterials: JSON.parse(d.acceptedMaterials || '[]'),
    hours: d.hours || undefined,
    contactName: d.contactName || undefined,
    contactPhone: d.contactPhone || undefined,
    active: d.active === 1,
    createdAt: d.createdAt,
  }));

  const formattedYards = yards.map((y: any) => ({
    id: y.id,
    name: y.name,
    address: y.address,
    latitude: y.latitude || undefined,
    longitude: y.longitude || undefined,
    active: y.active === 1,
    createdAt: y.createdAt,
  }));

  const formattedCustomers = customers.map((c: any) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone || undefined,
    email: c.email || undefined,
    billingAddress: c.billingAddress || undefined,
    notes: c.notes || undefined,
    active: c.active === 1,
    createdAt: c.createdAt,
  }));

  const fileContent = `import type { Driver, Truck, DumpSite, Yard, Customer, CommercialRoute, ResidentialRoute, ContainerRoute, ResidentialCustomer, ResidentialStop } from '@/types';

export const sampleDrivers: Driver[] = ${JSON.stringify(formattedDrivers, null, 2)};

export const sampleTrucks: Truck[] = ${JSON.stringify(formattedTrucks, null, 2)};

export const sampleDumpSites: DumpSite[] = ${JSON.stringify(formattedDumpSites, null, 2)};

export const sampleYards: Yard[] = ${JSON.stringify(formattedYards, null, 2)};

export const sampleCustomers: Customer[] = ${JSON.stringify(formattedCustomers, null, 2)};

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
  const name = \`\${firstName} \${lastName}\`;
  const address = \`\${streetNum} \${street}, City, FL 12345\`;
  
  const customer: ResidentialCustomer = {
    id: \`resi-customer-\${i + 1}\`,
    name,
    address,
    phone: \`555-\${String(1000 + i).padStart(4, '0')}\`,
    serviceDay,
    serviceFrequency: 'ONCE_WEEK',
    active: true,
    createdAt: new Date().toISOString(),
  };
  
  const stop: ResidentialStop = {
    id: \`resi-stop-\${i + 1}\`,
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
`;

  const filePath = join(process.cwd(), 'utils', 'sampleData.ts');
  writeFileSync(filePath, fileContent, 'utf-8');

  return {
    success: true,
    message: 'Sample data updated successfully',
    counts: {
      drivers: drivers.length,
      trucks: trucks.length,
      dumpSites: dumpSites.length,
      yards: yards.length,
      customers: customers.length,
    },
  };
});
