// Blood compatibility matrix & scoring
// Adapted from the original Blood-line-Navigator project
import { BloodType, BLOOD_TYPES } from './types';

// canDonateTo[donor] = list of compatible recipients
export const CAN_DONATE_TO: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// canReceiveFrom[recipient] = list of compatible donors
export const CAN_RECEIVE_FROM: Record<BloodType, BloodType[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export function getCompatibilityScore(donor: BloodType, recipient: BloodType): number {
  if (donor === recipient) return 100;
  if (CAN_DONATE_TO[donor]?.includes(recipient)) {
    const rhMatch =
      (donor.endsWith('+') && recipient.endsWith('+')) ||
      (donor.endsWith('-') && recipient.endsWith('-'));
    return rhMatch ? 90 : 75;
  }
  return 0;
}

export function isCompatible(donor: BloodType, recipient: BloodType): boolean {
  return CAN_DONATE_TO[donor]?.includes(recipient) ?? false;
}

export function getRankedDonors(recipientType: BloodType) {
  return BLOOD_TYPES.map((t) => ({
    type: t,
    score: getCompatibilityScore(t, recipientType),
    compatible: CAN_RECEIVE_FROM[recipientType]?.includes(t) ?? false,
  })).sort((a, b) => b.score - a.score);
}
