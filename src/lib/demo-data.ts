// Demo data for Blood Navigator — simulated data for assessment demonstration
// Uses South Indian hospitals from the original project as reference
import { BloodBank, InventoryUnit, BloodRequest, Alert, BloodType, ComponentType } from './types';

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString();
}

export const DEMO_BLOOD_BANKS: BloodBank[] = [
  {
    id: 'bb-1', name: 'Ramanathapuram GH Blood Bank', city: 'Ramanathapuram',
    address: 'Collector Office Road, Ramanathapuram 623501',
    lat: 9.3639, lng: 78.8395, capacity: 500, contact: '+91-4567-220330',
    emergencyActive: true, createdAt: hoursAgo(2400),
  },
  {
    id: 'bb-2', name: 'IRT-PM Blood Bank', city: 'Paramakudi',
    address: 'Main Road, Paramakudi 623707',
    lat: 9.5447, lng: 78.5912, capacity: 300, contact: '+91-4564-224455',
    emergencyActive: true, createdAt: hoursAgo(2400),
  },
  {
    id: 'bb-3', name: 'Rameswaram Blood Centre', city: 'Rameswaram',
    address: 'Pamban Road, Rameswaram 623526',
    lat: 9.2876, lng: 79.3129, capacity: 200, contact: '+91-4573-221100',
    emergencyActive: true, createdAt: hoursAgo(2400),
  },
  {
    id: 'bb-4', name: 'Kamuthi Government Hospital Blood Bank', city: 'Kamuthi',
    address: 'Hospital Road, Kamuthi 623604',
    lat: 9.4023, lng: 78.9433, capacity: 180, contact: '+91-4577-262233',
    emergencyActive: false, createdAt: hoursAgo(2400),
  },
  {
    id: 'bb-5', name: 'GRH Madurai Blood Bank', city: 'Madurai',
    address: 'Panagal Road, Madurai 625020',
    lat: 9.9252, lng: 78.1198, capacity: 800, contact: '+91-452-2532535',
    emergencyActive: true, createdAt: hoursAgo(2400),
  },
];

const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const componentTypes: ComponentType[] = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'];

export function generateDemoInventory(): InventoryUnit[] {
  const units: InventoryUnit[] = [];
  let counter = 1;

  // For the core demo scenario: unit with 10h remaining at bb-1
  units.push({
    id: `inv-${counter++}`, bloodBankId: 'bb-1', componentType: 'Packed RBC',
    bloodType: 'O+', collectionTimestamp: hoursAgo(330), expiryTimestamp: hoursFromNow(10),
    quantity: 4, status: 'available', storageTemp: '2-6°C', transportEligible: true,
    lastUpdated: new Date().toISOString(),
  });

  // Various expiry ranges
  const expiryHours = [3, 6, 10, 18, 24, 48, 72, 120, 168, 240, 336];
  
  for (const bank of DEMO_BLOOD_BANKS) {
    for (let i = 0; i < 8; i++) {
      const bt = bloodTypes[i % bloodTypes.length];
      const ct = componentTypes[i % componentTypes.length];
      const expH = expiryHours[Math.floor(Math.random() * expiryHours.length)];
      const qty = Math.floor(Math.random() * 10) + 1;
      const statuses: ('available' | 'reserved' | 'quarantined')[] = ['available', 'available', 'available', 'reserved', 'quarantined'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      units.push({
        id: `inv-${counter++}`, bloodBankId: bank.id, componentType: ct,
        bloodType: bt, collectionTimestamp: hoursAgo(Math.max(340 - expH, 24)),
        expiryTimestamp: hoursFromNow(expH), quantity: qty, status,
        storageTemp: ct === 'Platelets' ? '20-24°C' : ct === 'Fresh Frozen Plasma' ? '-25°C' : '2-6°C',
        transportEligible: status === 'available', lastUpdated: new Date().toISOString(),
      });
    }
  }

  // Add some expired units for testing
  units.push({
    id: `inv-${counter++}`, bloodBankId: 'bb-1', componentType: 'Whole Blood',
    bloodType: 'A-', collectionTimestamp: hoursAgo(850), expiryTimestamp: hoursAgo(2),
    quantity: 2, status: 'expired', storageTemp: '2-6°C', transportEligible: false,
    lastUpdated: new Date().toISOString(),
  });
  units.push({
    id: `inv-${counter++}`, bloodBankId: 'bb-2', componentType: 'Packed RBC',
    bloodType: 'B-', collectionTimestamp: hoursAgo(850), expiryTimestamp: hoursAgo(5),
    quantity: 3, status: 'expired', storageTemp: '2-6°C', transportEligible: false,
    lastUpdated: new Date().toISOString(),
  });

  return units;
}

export function generateDemoRequests(): BloodRequest[] {
  return [
    {
      id: 'req-1', destinationBankId: 'bb-2', bloodType: 'O+', componentType: 'Packed RBC',
      quantity: 3, priority: 'urgent', status: 'pending',
      createdAt: hoursAgo(2), neededBy: hoursFromNow(8),
      notes: 'Trauma case — requires O+ Packed RBC',
    },
    {
      id: 'req-2', destinationBankId: 'bb-3', bloodType: 'A+', componentType: 'Whole Blood',
      quantity: 5, priority: 'routine', status: 'pending',
      createdAt: hoursAgo(6), neededBy: hoursFromNow(24),
      notes: 'Scheduled surgery prep',
    },
    {
      id: 'req-3', destinationBankId: 'bb-4', bloodType: 'AB-', componentType: 'Fresh Frozen Plasma',
      quantity: 2, priority: 'emergency', status: 'pending',
      createdAt: hoursAgo(1), neededBy: hoursFromNow(4),
      notes: 'Emergency transfusion — AB- FFP needed urgently',
    },
    {
      id: 'req-4', destinationBankId: 'bb-5', bloodType: 'B+', componentType: 'Platelets',
      quantity: 4, priority: 'routine', status: 'pending',
      createdAt: hoursAgo(12), neededBy: hoursFromNow(48),
      notes: 'Restocking platelets',
    },
    {
      id: 'req-5', destinationBankId: 'bb-2', bloodType: 'O-', componentType: 'Packed RBC',
      quantity: 2, priority: 'urgent', status: 'processing',
      createdAt: hoursAgo(4), neededBy: hoursFromNow(12),
      notes: 'Universal donor RBC for emergency reserve',
    },
  ];
}

export function generateDemoAlerts(): Alert[] {
  return [
    {
      id: 'alert-1', type: 'expiring_soon', severity: 'critical',
      message: 'Packed RBC unit inv-1 at Ramanathapuram GH has only 10 hours remaining',
      linkedRecordId: 'inv-1', linkedRecordType: 'inventory',
      read: false, resolved: false, createdAt: new Date().toISOString(), resolvedAt: null,
    },
    {
      id: 'alert-2', type: 'low_stock', severity: 'warning',
      message: 'AB- stock critically low across all blood banks',
      linkedRecordId: null, linkedRecordType: null,
      read: false, resolved: false, createdAt: hoursAgo(1), resolvedAt: null,
    },
    {
      id: 'alert-3', type: 'pending_request', severity: 'warning',
      message: 'Emergency request req-3 for AB- FFP at Kamuthi Hospital needs attention',
      linkedRecordId: 'req-3', linkedRecordType: 'request',
      read: false, resolved: false, createdAt: hoursAgo(1), resolvedAt: null,
    },
    {
      id: 'alert-4', type: 'expired', severity: 'critical',
      message: '2 units of A- Whole Blood expired at Ramanathapuram GH Blood Bank',
      linkedRecordId: 'bb-1', linkedRecordType: 'blood_bank',
      read: false, resolved: false, createdAt: hoursAgo(2), resolvedAt: null,
    },
  ];
}
