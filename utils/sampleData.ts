import type { Driver, Truck, DumpSite, Yard, Customer } from '@/types';

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
