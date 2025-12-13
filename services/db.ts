import { supabase } from './supabaseClient';
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
        console.log("Database appears empty or connection failed. Using Mock Data.");
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
      console.warn("Error loading data from Supabase (Offline Mode Activated):", error);
      // Fallback to MOCK DATA so the app is never blank
      return {
        machines: MOCK_MACHINES,
        definitions: MOCK_PART_DEFINITIONS,
        parts: INITIAL_INSTALLED_PARTS,
        logs: [] as MaintenanceLog[]
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
    try {
        const payload = mapKeysToSnake(machines);
        const { error } = await supabase.from('machines').upsert(payload);
        if (error) throw error;
    } catch (e) { console.warn("Offline mode: Cannot save machines to DB"); }
  },

  /**
   * Delete Machine
   */
  async deleteMachine(id: string) {
    try {
        const { error } = await supabase.from('machines').delete().eq('id', id);
        if (error) throw error;
    } catch (e) { console.warn("Offline mode: Cannot delete machine from DB"); }
  },

  /**
   * Save (Upsert) Part Definitions
   */
  async saveDefinitions(defs: PartDefinition[]) {
    if (defs.length === 0) return;
    try {
        const payload = mapKeysToSnake(defs);
        const { error } = await supabase.from('part_definitions').upsert(payload);
        if (error) throw error;
    } catch (e) { console.warn("Offline mode: Cannot save definitions to DB"); }
  },

  /**
   * Delete Part Definition
   */
  async deleteDefinition(id: string) {
    try {
        const { error } = await supabase.from('part_definitions').delete().eq('id', id);
        if (error) throw error;
    } catch (e) { console.warn("Offline mode: Cannot delete definition from DB"); }
  },

  /**
   * Save (Upsert) Installed Parts
   */
  async saveParts(parts: InstalledPart[]) {
    if (parts.length === 0) return;
    try {
        const payload = mapKeysToSnake(parts);
        const { error } = await supabase.from('installed_parts').upsert(payload);
        if (error) throw error;
    } catch (e) { console.warn("Offline mode: Cannot save parts to DB"); }
  },

  /**
   * Delete Installed Part
   */
  async deletePart(id: string) {
    try {
        const { error } = await supabase.from('installed_parts').delete().eq('id', id);
        if (error) throw error;
    } catch (e) { console.warn("Offline mode: Cannot delete part from DB"); }
  },

  /**
   * Save (Upsert) Logs
   */
  async saveLogs(logs: MaintenanceLog[]) {
    if (logs.length === 0) return;
    try {
        const payload = mapKeysToSnake(logs);
        const { error } = await supabase.from('maintenance_logs').upsert(payload);
        if (error) throw error;
    } catch (e) { console.warn("Offline mode: Cannot save logs to DB"); }
  }
};