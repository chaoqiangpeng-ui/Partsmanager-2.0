import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MachineView } from './components/MachineView';
import { PartView } from './components/PartView';
import { Modal } from './components/ui/Modal';
import { Machine, InstalledPart, PopulatedPart, PartStatus, PartDefinition, MaintenanceLog } from './types';
import { analyzeMaintenanceData } from './services/geminiService';
import { db } from './services/db';
import { Sparkles, Loader2 } from 'lucide-react';

const PROSE_STYLES = "prose prose-sm prose-slate max-w-none prose-h3:text-lg prose-h3:font-bold prose-ul:list-disc prose-li:ml-4";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'machines' | 'parts'>('dashboard');
  
  // App State
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [partDefinitions, setPartDefinitions] = useState<PartDefinition[]>([]);
  const [installedParts, setInstalledParts] = useState<InstalledPart[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  
  // AI State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // 1. INITIAL LOAD (Simulate fetching from Database)
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const data = await db.loadAllData();
        setMachines(data.machines);
        setPartDefinitions(data.definitions);
        setInstalledParts(data.parts);
        setMaintenanceLogs(data.logs);
      } catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load system data. Running in offline mode.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Helper to update state AND persistence layer
  const updateMachines = (newMachines: Machine[]) => {
    setMachines(newMachines);
    db.saveMachines(newMachines);
  };
  
  const updateDefinitions = (newDefs: PartDefinition[]) => {
    setPartDefinitions(newDefs);
    db.saveDefinitions(newDefs);
  };

  const updateParts = (newParts: InstalledPart[]) => {
    setInstalledParts(newParts);
    db.saveParts(newParts);
  };

  const updateLogs = (newLogs: MaintenanceLog[]) => {
    setMaintenanceLogs(newLogs);
    db.saveLogs(newLogs);
  };

  // --- DELETE HANDLERS ---
  
  const handleDeleteMachine = async (id: string) => {
    // 1. Remove parts installed on this machine
    const partsToRemove = installedParts.filter(p => p.machineId === id);
    const partsToKeep = installedParts.filter(p => p.machineId !== id);
    
    // 2. Remove machine
    const machinesToKeep = machines.filter(m => m.id !== id);

    // Update State
    setInstalledParts(partsToKeep);
    setMachines(machinesToKeep);

    // Update DB
    await db.deleteMachine(id);
    for (const part of partsToRemove) {
      await db.deletePart(part.id);
    }
  };

  const handleDeleteDefinition = async (id: string) => {
    // Check if used
    const isUsed = installedParts.some(p => p.definitionId === id);
    if (isUsed) {
      alert("Cannot delete this part type because there are installed parts of this type. Please uninstall them first.");
      return;
    }

    const defsToKeep = partDefinitions.filter(d => d.id !== id);
    setPartDefinitions(defsToKeep);
    await db.deleteDefinition(id);
  };

  const handleDeleteInstalledPart = async (id: string) => {
    const partsToKeep = installedParts.filter(p => p.id !== id);
    setInstalledParts(partsToKeep);
    await db.deletePart(id);
  };


  // Derived state: Join Parts with Definitions and Machines, calculate health
  const populatedParts: PopulatedPart[] = useMemo(() => {
    const now = new Date(); 

    return installedParts.map(part => {
      const def = partDefinitions.find(d => d.id === part.definitionId);
      const mach = machines.find(m => m.id === part.machineId);
      
      if (!def || !mach) return null;

      // Real-time calculation logic
      const installDate = new Date(part.installDate);
      const diffTime = Math.abs(now.getTime() - installDate.getTime());
      const realTimeDaysUsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const usageRatio = realTimeDaysUsed / def.maxLifetimeDays;
      const healthPercentage = Math.max(0, (1 - usageRatio) * 100);
      
      let status = PartStatus.GOOD;
      if (healthPercentage < 10) status = PartStatus.CRITICAL;
      else if (healthPercentage < 30) status = PartStatus.WARNING;

      return {
        ...part,
        definition: def,
        machineName: mach.name,
        currentDaysUsed: realTimeDaysUsed,
        healthPercentage,
        status
      };
    }).filter((p): p is PopulatedPart => p !== null);
  }, [installedParts, machines, partDefinitions]);

  // Data Management Actions
  const handleExportData = () => {
    const data = {
      machines,
      partDefinitions,
      installedParts,
      maintenanceLogs,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifecycle_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.machines && data.partDefinitions && data.installedParts) {
          if (window.confirm('This will overwrite your current data. Are you sure?')) {
            updateMachines(data.machines);
            updateDefinitions(data.partDefinitions);
            updateParts(data.installedParts);
            updateLogs(data.maintenanceLogs || []);
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse the file.');
      }
    };
    reader.readAsText(file);
  };

  // --- BATCH IMPORT FROM CSV ---
  const handleBatchImport = async (csvText: string) => {
    try {
      // 1. Basic CSV Parsing (remove BOM, split lines)
      const cleanText = csvText.replace(/^\uFEFF/, '');
      const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== '');
      
      // Remove header (assuming index 0 is header: "Machine Name, Machine ID, Part Name...")
      const rows = lines.slice(1);

      if (rows.length === 0) {
        alert("CSV file appears to be empty.");
        return;
      }

      // Temporary arrays to hold new/existing items to batch update at the end
      let currentMachines = [...machines];
      let currentDefs = [...partDefinitions];
      const newPartsToAdd: InstalledPart[] = [];
      let addedMachinesCount = 0;
      let addedDefsCount = 0;
      let addedPartsCount = 0;

      for (const row of rows) {
        // Simple regex split that ignores commas inside quotes
        const strip = (s: string) => s ? s.trim().replace(/^"|"$/g, '').replace(/""/g, '"') : '';

        // Split by comma, but not commas inside quotes
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(','); 
        const cells = row.split(',').map(c => strip(c));

        // Mapping based on Export format:
        // 0: Machine Name, 1: Machine ID, 2: Part Name, 3: Category, 4: Serial, 5: Install Date, 6: Lifetime
        const machineName = cells[0];
        const partName = cells[2];
        const category = cells[3];
        const serialNumber = cells[4];
        const installDateRaw = cells[5];
        const lifetime = parseInt(cells[6]) || 365;

        if (!machineName || !partName || !serialNumber) continue; // Skip invalid rows

        // A. Handle Machine
        let machineId = currentMachines.find(m => m.name.toLowerCase() === machineName.toLowerCase())?.id;
        if (!machineId) {
          // Create new Machine
          machineId = `m_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          const newMachine: Machine = {
            id: machineId,
            name: machineName,
            location: 'Imported', // Default
            model: 'Unknown',     // Default
            status: 'active'
          };
          currentMachines = [...currentMachines, newMachine];
          addedMachinesCount++;
        }

        // B. Handle Part Definition
        let defId = currentDefs.find(d => d.name.toLowerCase() === partName.toLowerCase())?.id;
        if (!defId) {
          // Create new Definition
          defId = `p_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          const newDef: PartDefinition = {
            id: defId,
            name: partName,
            category: category || 'General',
            maxLifetimeDays: lifetime,
            cost: 0
          };
          currentDefs = [...currentDefs, newDef];
          addedDefsCount++;
        }

        // C. Handle Installed Part
        // Check if this serial number already exists to avoid duplicates
        const exists = installedParts.some(p => p.partNumber === serialNumber) || newPartsToAdd.some(p => p.partNumber === serialNumber);
        
        if (!exists) {
          // Calculate days used
          let currentDays = 0;
          try {
             const installTime = new Date(installDateRaw).getTime();
             const now = new Date().getTime();
             currentDays = Math.max(0, Math.floor((now - installTime) / (1000 * 60 * 60 * 24)));
          } catch(e) {}

          const newPart: InstalledPart = {
            id: `inst_${Date.now()}_${Math.floor(Math.random()*10000)}`,
            machineId: machineId,
            definitionId: defId,
            partNumber: serialNumber,
            installDate: new Date(installDateRaw).toISOString(),
            currentDaysUsed: currentDays
          };
          newPartsToAdd.push(newPart);
          addedPartsCount++;
        }
      }

      // Batch Update State & DB
      if (addedMachinesCount > 0) updateMachines(currentMachines);
      if (addedDefsCount > 0) updateDefinitions(currentDefs);
      if (addedPartsCount > 0) updateParts([...installedParts, ...newPartsToAdd]);

      alert(`Batch Import Successful!\n\nNew Machines: ${addedMachinesCount}\nNew Part Types: ${addedDefsCount}\nParts Installed: ${addedPartsCount}`);

    } catch (error) {
      console.error("Batch import failed", error);
      alert("Failed to process CSV file. Please ensure it matches the export template.");
    }
  };

  // Actions
  const handleReplacePart = (partId: string, newPartNumber: string, replaceDate?: string) => {
    const newInstallDate = replaceDate 
      ? new Date(replaceDate).toISOString() 
      : new Date().toISOString();

    const updatedParts = installedParts.map(p => {
      if (p.id === partId) {
        // Create Log Entry
        const partDef = partDefinitions.find(d => d.id === p.definitionId);
        
        const installDate = new Date(p.installDate);
        const now = new Date();
        const finalDaysUsed = Math.floor(Math.abs(now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24));

        const newLog: MaintenanceLog = {
            id: `log_${Date.now()}`,
            machineId: p.machineId,
            partDefinitionId: p.definitionId,
            partName: partDef?.name || 'Unknown Part',
            oldPartNumber: p.partNumber,
            newPartNumber: newPartNumber,
            replacedDate: newInstallDate,
            daysUsedAtReplacement: finalDaysUsed
        };
        // Update logs via helper
        updateLogs([newLog, ...maintenanceLogs]);

        // Update Part Instance
        return {
          ...p,
          id: `inst_${Date.now()}`,
          installDate: newInstallDate,
          currentDaysUsed: 0,
          partNumber: newPartNumber
        };
      }
      return p;
    });
    
    updateParts(updatedParts);
  };

  const handleUpdatePart = (partId: string, updates: Partial<InstalledPart>) => {
    const updated = installedParts.map(p => 
      p.id === partId ? { ...p, ...updates } : p
    );
    updateParts(updated);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const report = await analyzeMaintenanceData(populatedParts, machines);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  // Machine Actions
  const handleAddMachine = (machineData: Omit<Machine, 'id'>) => {
    const newMachine: Machine = {
      ...machineData,
      id: `m_${Date.now()}`
    };
    updateMachines([...machines, newMachine]);
  };

  const handleEditMachine = (updatedMachine: Machine) => {
    const updated = machines.map(m => m.id === updatedMachine.id ? updatedMachine : m);
    updateMachines(updated);
  };

  // Part Definition Actions
  const handleAddPartDefinition = (defData: Omit<PartDefinition, 'id'>) => {
    const newDef: PartDefinition = {
      ...defData,
      id: `p_${Date.now()}`
    };
    updateDefinitions([...partDefinitions, newDef]);
  };

  const handleEditPartDefinition = (updatedDef: PartDefinition) => {
    const updated = partDefinitions.map(d => d.id === updatedDef.id ? updatedDef : d);
    updateDefinitions(updated);
  };

  const handleInstallPart = (machineId: string, definitionId: string, partNumber: string) => {
    const newPart: InstalledPart = {
      id: `inst_${Date.now()}`,
      definitionId,
      machineId,
      installDate: new Date().toISOString(),
      currentDaysUsed: 0,
      partNumber: partNumber
    };
    updateParts([...installedParts, newPart]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Connecting to system...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            parts={populatedParts} 
            machines={machines} 
            onGenerateReport={handleGenerateReport}
            isGeneratingReport={isGeneratingReport}
            onExport={handleExportData}
            onImport={handleImportData}
            onReplacePart={handleReplacePart}
          />
        )}
        {activeTab === 'machines' && (
          <MachineView 
            machines={machines} 
            parts={populatedParts} 
            partDefinitions={partDefinitions}
            maintenanceLogs={maintenanceLogs}
            onReplacePart={handleReplacePart}
            onUpdatePart={handleUpdatePart}
            onAddMachine={handleAddMachine}
            onEditMachine={handleEditMachine}
            onDeleteMachine={handleDeleteMachine}
            onInstallPart={handleInstallPart}
            onDeleteInstalledPart={handleDeleteInstalledPart}
            onBatchImport={handleBatchImport}
          />
        )}
        {activeTab === 'parts' && (
          <PartView 
            definitions={partDefinitions} 
            parts={populatedParts} 
            onReplacePart={handleReplacePart}
            onUpdatePart={handleUpdatePart}
            onAddDefinition={handleAddPartDefinition}
            onEditDefinition={handleEditPartDefinition}
            onDeleteDefinition={handleDeleteDefinition}
          />
        )}
      </Layout>

      {/* AI Report Modal */}
      <Modal
        isOpen={!!aiReport}
        onClose={() => setAiReport(null)}
        title="AI Maintenance Analysis"
      >
        <div className="flex items-center gap-2 mb-4 text-indigo-600">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Insights Generated</span>
        </div>
        <div 
          className={PROSE_STYLES}
          dangerouslySetInnerHTML={{ __html: aiReport || '' }} 
        />
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => setAiReport(null)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-sm"
          >
            Close Report
          </button>
        </div>
      </Modal>
    </>
  );
};

export default App;