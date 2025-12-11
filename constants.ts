import { Machine, PartDefinition, InstalledPart } from './types';

export const MOCK_MACHINES: Machine[] = [
  { id: 'm1', name: 'CNC Router Alpha', location: 'Zone A', model: 'X-2000', status: 'active' },
  { id: 'm2', name: 'Injection Molder Beta', location: 'Zone B', model: 'Inj-500', status: 'active' },
  { id: 'm3', name: 'Conveyor Belt System', location: 'Zone C', model: 'Conv-Pro', status: 'maintenance' },
  { id: 'm4', name: 'Robotic Arm Delta', location: 'Zone A', model: 'Arm-V6', status: 'active' },
];

export const MOCK_PART_DEFINITIONS: PartDefinition[] = [
  { id: 'p1', name: 'Spindle Bearing', category: 'Mechanical', maxLifetimeDays: 365, cost: 250 },
  { id: 'p2', name: 'Hydraulic Pump', category: 'Hydraulic', maxLifetimeDays: 730, cost: 1200 },
  { id: 'p3', name: 'Servo Motor', category: 'Electrical', maxLifetimeDays: 1095, cost: 800 },
  { id: 'p4', name: 'Drive Belt', category: 'Mechanical', maxLifetimeDays: 180, cost: 45 },
  { id: 'p5', name: 'Filter Unit', category: 'Consumable', maxLifetimeDays: 30, cost: 25 },
];

// Helper to generate some initial state
const generateInitialParts = (): InstalledPart[] => {
  const parts: InstalledPart[] = [];
  let partCounter = 1;

  MOCK_MACHINES.forEach(machine => {
    // Assign random parts to machines
    MOCK_PART_DEFINITIONS.forEach(def => {
      // 70% chance a machine has this part type
      if (Math.random() > 0.3) {
        const usageRatio = Math.random(); // 0 to 1
        const daysUsed = Math.floor(def.maxLifetimeDays * usageRatio);
        
        // Calculate a fake install date based on days used
        const installDate = new Date();
        installDate.setDate(installDate.getDate() - daysUsed);
        
        const randomSerial = `SN-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        parts.push({
          id: `inst_${partCounter++}`,
          definitionId: def.id,
          machineId: machine.id,
          installDate: installDate.toISOString(),
          currentDaysUsed: daysUsed,
          partNumber: randomSerial
        });
      }
    });
  });
  return parts;
};

export const INITIAL_INSTALLED_PARTS = generateInitialParts();