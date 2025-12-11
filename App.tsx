import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MachineView } from './components/MachineView';
import { PartView } from './components/PartView';
import { Modal } from './components/ui/Modal';
import { MOCK_MACHINES, MOCK_PART_DEFINITIONS, INITIAL_INSTALLED_PARTS } from './constants';
import { Machine, InstalledPart, PopulatedPart, PartStatus, PartDefinition, MaintenanceLog } from './types';
import { analyzeMaintenanceData } from './services/geminiService';
import { Sparkles } from 'lucide-react';

// Define styles for generated HTML content from AI
const PROSE_STYLES = "prose prose-sm prose-slate max-w-none prose-h3:text-lg prose-h3:font-bold prose-ul:list-disc prose-li:ml-4";

// Helper hook for LocalStorage
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'machines' | 'parts'>('dashboard');
  
  // App State with Persistence
  const [machines, setMachines] = useStickyState<Machine[]>(MOCK_MACHINES, 'lcp_machines');
  const [partDefinitions, setPartDefinitions] = useStickyState<PartDefinition[]>(MOCK_PART_DEFINITIONS, 'lcp_definitions');
  const [installedParts, setInstalledParts] = useStickyState<InstalledPart[]>(INITIAL_INSTALLED_PARTS, 'lcp_installed_parts');
  const [maintenanceLogs, setMaintenanceLogs] = useStickyState<MaintenanceLog[]>([], 'lcp_logs');
  
  // AI State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Derived state: Join Parts with Definitions and Machines, calculate health
  const populatedParts: PopulatedPart[] = useMemo(() => {
    return installedParts.map(part => {
      const def = partDefinitions.find(d => d.id === part.definitionId);
      const mach = machines.find(m => m.id === part.machineId);
      
      // Filter out parts if def or machine was deleted
      if (!def || !mach) return null;

      // Calculate health (Inverse of usage percentage)
      const usageRatio = part.currentDaysUsed / def.maxLifetimeDays;
      const healthPercentage = Math.max(0, (1 - usageRatio) * 100);
      
      let status = PartStatus.GOOD;
      if (healthPercentage < 10) status = PartStatus.CRITICAL;
      else if (healthPercentage < 30) status = PartStatus.WARNING;

      return {
        ...part,
        definition: def,
        machineName: mach.name,
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
            setMachines(data.machines);
            setPartDefinitions(data.partDefinitions);
            setInstalledParts(data.installedParts);
            setMaintenanceLogs(data.maintenanceLogs || []);
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
  const handleReplacePart = (partId: string, newPartNumber: string) => {
    setInstalledParts(prev => prev.map(p => {
      if (p.id === partId) {
        // Create Log Entry
        const partDef = partDefinitions.find(d => d.id === p.definitionId);
        const newLog: MaintenanceLog = {
            id: `log_${Date.now()}`,
            machineId: p.machineId,
            partDefinitionId: p.definitionId,
            partName: partDef?.name || 'Unknown Part',
            oldPartNumber: p.partNumber,
            newPartNumber: newPartNumber,
            replacedDate: new Date().toISOString(),
            daysUsedAtReplacement: p.currentDaysUsed
        };
        setMaintenanceLogs(logs => [newLog, ...logs]);

        // Update Part Instance
        return {
          ...p,
          id: `inst_${Date.now()}`, // Generate new instance ID for the new physical part
          installDate: new Date().toISOString(),
          currentDaysUsed: 0, // Reset usage
          partNumber: newPartNumber
        };
      }
      return p;
    }));
  };

  const handleUpdatePart = (partId: string, updates: Partial<InstalledPart>) => {
    setInstalledParts(prev => prev.map(p => 
      p.id === partId ? { ...p, ...updates } : p
    ));
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
      id: `m_${Date.now()}` // Simple ID generation
    };
    setMachines([...machines, newMachine]);
  };

  const handleEditMachine = (updatedMachine: Machine) => {
    setMachines(prev => prev.map(m => m.id === updatedMachine.id ? updatedMachine : m));
  };

  // Part Definition Actions
  const handleAddPartDefinition = (defData: Omit<PartDefinition, 'id'>) => {
    const newDef: PartDefinition = {
      ...defData,
      id: `p_${Date.now()}`
    };
    setPartDefinitions([...partDefinitions, newDef]);
  };

  const handleEditPartDefinition = (updatedDef: PartDefinition) => {
    setPartDefinitions(prev => prev.map(d => d.id === updatedDef.id ? updatedDef : d));
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
    setInstalledParts([...installedParts, newPart]);
  };

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