import { supabase } from '../src/supabaseClient';
import { Machine, PartDefinition, InstalledPart, MaintenanceLog } from '../types';
import { MOCK_MACHINES, MOCK_PART_DEFINITIONS, INITIAL_INSTALLED_PARTS } from '../constants';

// --- HELPER FUNCTIONS FOR CASE CONVERSION ---
// Supabase/Postgres uses snake_case, App uses camelCase.

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const mapKeysToSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(mapKeysToSnake);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[toSnakeCase(key)] = obj[key];
      return acc;
    }, {} as any);
  }
  return obj;
};

const mapKeysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(mapKeysToCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[toCamelCase(key)] = obj[key];
      return acc;
    }, {} as any);
  }
  return obj;
};

// --- DB SERVICE ---

export const db = {
  /**
   * Loads all initial data from Supabase.
   * If tables are empty, it seeds them with MOCK data automatically.
   */
  async loadAllData() {
    try {
      // Parallel fetch from all tables
      const [machinesRes, defsRes, partsRes, logsRes] = await Promise.all([
        supabase.from('machines').select('*'),
        supabase.from('part_definitions').select('*'),
        supabase.from('installed_parts').select('*'),
        supabase.from('maintenance_logs').select('*')
      ]);

      if (machinesRes.error) throw machinesRes.error;
      if (defsRes.error) throw defsRes.error;
      if (partsRes.error) throw partsRes.error;
      if (logsRes.error) throw logsRes.error;

      // Check if DB is empty (First run)
      if (!machinesRes.data || machinesRes.data.length === 0) {
        console.log("Database appears empty. Seeding initial data...");
        await this.seedInitialData();
        // Return the mock data directly so UI updates immediately without re-fetch
        return {
          machines: MOCK_MACHINES,
          definitions: MOCK_PART_DEFINITIONS,
          parts: INITIAL_INSTALLED_PARTS,
          logs: [] as MaintenanceLog[]
        };
      }

      // Return mapped data (snake_case from DB -> camelCase for App)
      return {
        machines: mapKeysToCamel(machinesRes.data) as Machine[],
        definitions: mapKeysToCamel(defsRes.data) as PartDefinition[],
        parts: mapKeysToCamel(partsRes.data) as InstalledPart[],
        logs: mapKeysToCamel(logsRes.data) as MaintenanceLog[]
      };

    } catch (error) {
      console.error("Error loading data from Supabase:", error);
      // Fallback to empty/mock in case of connection error to prevent white screen
      return {
        machines: [],
        definitions: [],
        parts: [],
        logs: []
      };
    }
  },

  /**
   * Seeds the database with initial mock data
   */
  async seedInitialData() {
    await this.saveMachines(MOCK_MACHINES);
    await this.saveDefinitions(MOCK_PART_DEFINITIONS);
    await this.saveParts(INITIAL_INSTALLED_PARTS);
  },

  /**
   * Save (Upsert) Machines
   */
  async saveMachines(machines: Machine[]) {
    if (machines.length === 0) return;
    const payload = mapKeysToSnake(machines);
    const { error } = await supabase.from('machines').upsert(payload);
    if (error) console.error('Error saving machines:', error);
  },

  /**
   * Save (Upsert) Part Definitions
   */
  async saveDefinitions(defs: PartDefinition[]) {
    if (defs.length === 0) return;
    const payload = mapKeysToSnake(defs);
    const { error } = await supabase.from('part_definitions').upsert(payload);
    if (error) console.error('Error saving definitions:', error);
  },

  /**
   * Save (Upsert) Installed Parts
   */
  async saveParts(parts: InstalledPart[]) {
    if (parts.length === 0) return;
    const payload = mapKeysToSnake(parts);
    const { error } = await supabase.from('installed_parts').upsert(payload);
    if (error) console.error('Error saving parts:', error);
  },

  /**
   * Save (Upsert) Logs
   */
  async saveLogs(logs: MaintenanceLog[]) {
    if (logs.length === 0) return;
    const payload = mapKeysToSnake(logs);
    // Using upsert for logs ensures we don't create duplicates if ID exists
    const { error } = await supabase.from('maintenance_logs').upsert(payload);
    if (error) console.error('Error saving logs:', error);
  }
};