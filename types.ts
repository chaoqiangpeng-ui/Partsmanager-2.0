export enum PartStatus {
  GOOD = 'GOOD',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface PartDefinition {
  id: string;
  name: string;
  category: string;
  maxLifetimeDays: number; // The expected lifetime in days
  cost: number;
}

export interface InstalledPart {
  id: string;
  definitionId: string;
  machineId: string;
  installDate: string; // ISO String
  currentDaysUsed: number; // Days used
  partNumber: string; // Serial number or unique identifier
}

export interface MaintenanceLog {
  id: string;
  machineId: string;
  partDefinitionId: string;
  partName: string;
  oldPartNumber: string;
  newPartNumber: string;
  replacedDate: string;
  daysUsedAtReplacement: number;
}

export interface Machine {
  id: string;
  name: string;
  location: string;
  model: string;
  status: 'active' | 'maintenance' | 'offline';
}

export interface PopulatedPart extends InstalledPart {
  definition: PartDefinition;
  machineName: string;
  healthPercentage: number;
  status: PartStatus;
}