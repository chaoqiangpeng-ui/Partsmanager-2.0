import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MachineView } from './components/MachineView';
import { PartView } from './components/PartView';
import { Modal } from './components/ui/Modal';
import { Machine, InstalledPart, PopulatedPart, PartStatus, PartDefinition, MaintenanceLog } from './types';
import { analyzeMaintenanceData } from './services/geminiService';
import { db } from './services/db'; // Import the new DB service
import { Sparkles, Loader2 } from 'lucide-react';

const PROSE_STYLES = "prose prose-sm prose-slate max-w-none prose-h3:text-lg prose-h3:font-bold prose-ul:list-disc prose-li:ml-4";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'machines' | 'parts'>('dashboard');
  
  // App State - No longer using useStickyState, just standard React state
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
        alert("Failed to load system data.");
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
            onInstallPart={handleInstallPart}
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