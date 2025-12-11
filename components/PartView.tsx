import React, { useState } from 'react';
import { PartDefinition, PopulatedPart, PartStatus, InstalledPart } from '../types';
import { StatusBadge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { PartDefinitionForm } from './forms/PartDefinitionForm';
import { EditPartForm } from './forms/EditPartForm';
import { ReplacePartForm } from './forms/ReplacePartForm';
import { RefreshCw, Package, Plus, Pencil } from 'lucide-react';

interface PartViewProps {
  definitions: PartDefinition[];
  parts: PopulatedPart[];
  onReplacePart: (partId: string, newPartNumber: string) => void;
  onUpdatePart: (partId: string, updates: Partial<InstalledPart>) => void;
  onAddDefinition: (def: Omit<PartDefinition, 'id'>) => void;
  onEditDefinition: (def: PartDefinition) => void;
}

export const PartView: React.FC<PartViewProps> = ({ 
  definitions, 
  parts, 
  onReplacePart,
  onUpdatePart,
  onAddDefinition,
  onEditDefinition 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<PartDefinition | undefined>(undefined);
  
  // Edit Part State
  const [editPartModalOpen, setEditPartModalOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<PopulatedPart | null>(null);

  // Replace Part State
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [partToReplace, setPartToReplace] = useState<PopulatedPart | null>(null);

  const handleAddClick = () => {
    setEditingDef(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (def: PartDefinition) => {
    setEditingDef(def);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: PartDefinition | Omit<PartDefinition, 'id'>) => {
    if ('id' in data) {
      onEditDefinition(data);
    } else {
      onAddDefinition(data);
    }
    setIsModalOpen(false);
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

  const handleReplaceSubmit = (partId: string, newPartNumber: string) => {
    onReplacePart(partId, newPartNumber);
    setReplaceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-600" />
          Parts Inventory
        </h2>
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Part Type
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {definitions.map(def => {
          const installedInstances = parts.filter(p => p.definitionId === def.id);
          const avgHealth = installedInstances.length 
            ? installedInstances.reduce((acc, curr) => acc + curr.healthPercentage, 0) / installedInstances.length
            : 0;

          return (
            <div key={def.id} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full group relative">
              <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800 pr-6">{def.name}</h3>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded whitespace-nowrap">{def.category}</span>
                </div>
                <div className="text-sm text-slate-500 flex justify-between">
                  <span>Life: {def.maxLifetimeDays} days</span>
                  <span>Cost: ${def.cost}</span>
                </div>
                {/* Edit Button */}
                <button 
                  onClick={() => handleEditClick(def)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-indigo-600 rounded-md transition-all"
                  title="Edit Part Details"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1">
                  <span>Avg Health</span>
                  <span>{avgHealth.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${avgHealth < 30 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                    style={{ width: `${avgHealth}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex-1 p-0 overflow-y-auto max-h-64">
                <ul className="divide-y divide-slate-100">
                  {installedInstances.map(inst => (
                    <li key={inst.id} className="p-4 hover:bg-slate-50 transition-colors group/item">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{inst.machineName}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-400">Inst: {new Date(inst.installDate).toLocaleDateString()}</p>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1 rounded">{inst.partNumber}</span>
                            <button 
                                onClick={() => openEditPartModal(inst)}
                                className="text-slate-300 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-all"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <StatusBadge status={inst.status} />
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                         <div className="w-24">
                           <ProgressBar percentage={100 - inst.healthPercentage} status={inst.status} />
                         </div>
                         <button 
                            onClick={() => openReplaceModal(inst)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Replace
                          </button>
                      </div>
                    </li>
                  ))}
                  {installedInstances.length === 0 && (
                    <li className="p-4 text-center text-sm text-slate-400">Not installed on any machine.</li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDef ? 'Edit Part Definition' : 'Create New Part Type'}
      >
        <PartDefinitionForm
          initialData={editingDef}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
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
    </div>
  );
};