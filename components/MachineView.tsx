import React, { useState } from 'react';
import { Machine, PopulatedPart, PartStatus, PartDefinition, InstalledPart, MaintenanceLog } from '../types';
import { StatusBadge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { MachineForm } from './forms/MachineForm';
import { EditPartForm } from './forms/EditPartForm';
import { ReplacePartForm } from './forms/ReplacePartForm';
import { HistoryLog } from './HistoryLog';
import { RefreshCw, AlertTriangle, CheckCircle, Smartphone, Plus, Settings2, Wrench, Pencil, History, CalendarClock } from 'lucide-react';

interface MachineViewProps {
  machines: Machine[];
  parts: PopulatedPart[];
  partDefinitions: PartDefinition[];
  maintenanceLogs: MaintenanceLog[];
  onReplacePart: (partId: string, newPartNumber: string, replaceDate?: string) => void;
  onUpdatePart: (partId: string, updates: Partial<InstalledPart>) => void;
  onAddMachine: (machine: Omit<Machine, 'id'>) => void;
  onEditMachine: (machine: Machine) => void;
  onInstallPart: (machineId: string, definitionId: string, partNumber: string) => void;
}

export const MachineView: React.FC<MachineViewProps> = ({ 
  machines, 
  parts, 
  partDefinitions,
  maintenanceLogs,
  onReplacePart, 
  onUpdatePart,
  onAddMachine, 
  onEditMachine,
  onInstallPart
}) => {
  const [expandedMachineId, setExpandedMachineId] = useState<string | null>(null);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>(undefined);
  
  // Install Part State
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [selectedMachineForInstall, setSelectedMachineForInstall] = useState<string | null>(null);
  const [selectedPartDefId, setSelectedPartDefId] = useState<string>('');
  const [newPartNumber, setNewPartNumber] = useState('');

  // Edit Part State
  const [editPartModalOpen, setEditPartModalOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<PopulatedPart | null>(null);

  // Replace Part State
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [partToReplace, setPartToReplace] = useState<PopulatedPart | null>(null);

  // History State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedMachineHistory, setSelectedMachineHistory] = useState<Machine | null>(null);

  const toggleMachine = (id: string) => {
    setExpandedMachineId(prev => prev === id ? null : id);
  };

  const handleEditClick = (e: React.MouseEvent, machine: Machine) => {
    e.stopPropagation();
    setEditingMachine(machine);
    setIsMachineModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingMachine(undefined);
    setIsMachineModalOpen(true);
  };

  const handleMachineSubmit = (data: Machine | Omit<Machine, 'id'>) => {
    if ('id' in data) {
      onEditMachine(data);
    } else {
      onAddMachine(data);
    }
    setIsMachineModalOpen(false);
  };

  const openInstallModal = (machineId: string) => {
    setSelectedMachineForInstall(machineId);
    if (partDefinitions.length > 0) setSelectedPartDefId(partDefinitions[0].id);
    setNewPartNumber('');
    setInstallModalOpen(true);
  };

  const handleInstallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMachineForInstall && selectedPartDefId && newPartNumber) {
      onInstallPart(selectedMachineForInstall, selectedPartDefId, newPartNumber);
      setInstallModalOpen(false);
    }
  };

  const openEditPartModal = (part: PopulatedPart) => {
    setPartToEdit(part);
    setEditPartModalOpen(true);
  };

  const handleUpdatePartSubmit = (partId: string, updates: Partial<InstalledPart>) => {
    onUpdatePart(partId, updates);
    setEditPartModalOpen(false);
  };

  const openReplaceModal = (part: PopulatedPart) => {
    setPartToReplace(part);
    setReplaceModalOpen(true);
  }

  const handleReplaceSubmit = (partId: string, newPartNumber: string, replaceDate?: string) => {
    onReplacePart(partId, newPartNumber, replaceDate);
    setReplaceModalOpen(false);
  };

  const openHistoryModal = (machine: Machine) => {
    setSelectedMachineHistory(machine);
    setHistoryModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-blue-600" />
          Machine Overview
        </h2>
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Machine
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {machines.map(machine => {
          const machineParts = parts.filter(p => p.machineId === machine.id);
          const criticalCount = machineParts.filter(p => p.status === PartStatus.CRITICAL).length;
          const warningCount = machineParts.filter(p => p.status === PartStatus.WARNING).length;
          const isExpanded = expandedMachineId === machine.id;

          return (
            <div key={machine.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              {/* Header */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                onClick={() => toggleMachine(machine.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${criticalCount > 0 ? 'bg-rose-100' : 'bg-blue-100'}`}>
                     {criticalCount > 0 ? <AlertTriangle className="text-rose-600 w-6 h-6" /> : <CheckCircle className="text-blue-600 w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                      {machine.name}
                      <button 
                        onClick={(e) => handleEditClick(e, machine)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Machine Details"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </h3>
                    <p className="text-sm text-slate-500">{machine.model} • {machine.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex gap-2">
                     {criticalCount > 0 && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">{criticalCount} Critical</span>}
                     {warningCount > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{warningCount} Warning</span>}
                   </div>
                   <StatusBadge status={machine.status} />
                   <svg 
                    className={`w-5 h-5 text-slate-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                   >
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                   </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Installed Components</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openHistoryModal(machine)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                        View History
                      </button>
                      <button 
                        onClick={() => openInstallModal(machine.id)}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Install New Part
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold">
                        <tr>
                          <th className="px-4 py-3">Part Name</th>
                          <th className="px-4 py-3">Serial No.</th>
                          <th className="px-4 py-3">Install Date</th>
                          <th className="px-4 py-3">Est. Replacement</th>
                          <th className="px-4 py-3">Lifetime Used</th>
                          <th className="px-4 py-3">Health</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {machineParts.map(part => {
                          const installTime = new Date(part.installDate).getTime();
                          const maxLifeMs = part.definition.maxLifetimeDays * 24 * 60 * 60 * 1000;
                          const estEndDate = new Date(installTime + maxLifeMs);
                          
                          return (
                          <tr key={part.id} className="hover:bg-slate-50 group">
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {part.definition.name}
                              <div className="text-xs text-slate-400">{part.definition.category}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                              {part.partNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{new Date(part.installDate).toLocaleDateString()}</span>
                                <button 
                                  onClick={() => openEditPartModal(part)}
                                  className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  title="Edit Install Date"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                             <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{estEndDate.toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1 w-32">
                                <span className="text-xs">{part.currentDaysUsed} / {part.definition.maxLifetimeDays} days</span>
                                <ProgressBar percentage={100 - part.healthPercentage} status={part.status} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={part.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openReplaceModal(part); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Replace
                              </button>
                            </td>
                          </tr>
                        );
                        })}
                        {machineParts.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                              No parts recorded for this machine.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Machine Modal */}
      <Modal 
        isOpen={isMachineModalOpen} 
        onClose={() => setIsMachineModalOpen(false)}
        title={editingMachine ? 'Edit Machine' : 'Add New Machine'}
      >
        <MachineForm 
          initialData={editingMachine}
          onSubmit={handleMachineSubmit}
          onCancel={() => setIsMachineModalOpen(false)}
        />
      </Modal>

      {/* Install Part Modal */}
      <Modal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        title="Install New Part"
      >
        <form onSubmit={handleInstallSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Part Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPartDefId}
              onChange={e => setSelectedPartDefId(e.target.value)}
            >
              {partDefinitions.map(def => (
                <option key={def.id} value={def.id}>{def.name} ({def.category})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Part Number / Serial Number</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPartNumber}
              onChange={e => setNewPartNumber(e.target.value)}
              placeholder="e.g. SN-5544"
            />
            <p className="text-xs text-slate-500 mt-2">
              This will install a brand new {partDefinitions.find(d => d.id === selectedPartDefId)?.name} onto the selected machine. Usage will start at 0 days.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setInstallModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Install Part
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Installed Part Modal */}
      <Modal
        isOpen={editPartModalOpen}
        onClose={() => setEditPartModalOpen(false)}
        title="Edit Part Details"
      >
        {partToEdit && (
          <EditPartForm 
            part={partToEdit} 
            partName={partToEdit.definition.name}
            onSubmit={handleUpdatePartSubmit} 
            onCancel={() => setEditPartModalOpen(false)} 
          />
        )}
      </Modal>

      {/* Replace Confirmation Modal */}
      <Modal
        isOpen={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        title="Replace Part"
      >
        {partToReplace && (
          <ReplacePartForm
            part={partToReplace}
            onConfirm={handleReplaceSubmit}
            onCancel={() => setReplaceModalOpen(false)}
          />
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Maintenance History"
      >
        {selectedMachineHistory && (
          <HistoryLog 
            logs={maintenanceLogs.filter(l => l.machineId === selectedMachineHistory.id)}
            machineName={selectedMachineHistory.name}
          />
        )}
      </Modal>
    </div>
  );
};