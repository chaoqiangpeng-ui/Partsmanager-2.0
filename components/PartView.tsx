import React, { useState } from 'react';
import { PartDefinition, PopulatedPart, PartStatus, InstalledPart } from '../types';
import { StatusBadge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { PartDefinitionForm } from './forms/PartDefinitionForm';
import { ReplacePartForm } from './forms/ReplacePartForm';
import { RefreshCw, Package, Plus, Pencil, Clock } from 'lucide-react';

interface PartViewProps {
  definitions: PartDefinition[];
  parts: PopulatedPart[];
  onReplacePart: (partId: string, newPartNumber: string, replaceDate?: string) => void;
  onUpdatePart: (partId: string, updates: Partial<InstalledPart>) => void;
  onAddDefinition: (def: Omit<PartDefinition, 'id'>) => void;
  onEditDefinition: (def: PartDefinition) => void;
  onDeleteDefinition: (id: string) => void;
}

export const PartView: React.FC<PartViewProps> = ({ 
  definitions, 
  parts, 
  onReplacePart,
  onUpdatePart,
  onAddDefinition,
  onEditDefinition,
  onDeleteDefinition
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<PartDefinition | undefined>(undefined);
  
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

  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to delete this part type?")) {
        onDeleteDefinition(id);
        setIsModalOpen(false);
      }
  }

  const openReplaceModal = (part: PopulatedPart) => {
    setPartToReplace(part);
    setReplaceModalOpen(true);
  }

  const handleReplaceSubmit = (partId: string, newPartNumber: string, replaceDate?: string) => {
    onReplacePart(partId, newPartNumber, replaceDate);
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
            <div key={def.id} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full group relative overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800 pr-6">{def.name}</h3>
                  <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded whitespace-nowrap">{def.category}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{def.maxLifetimeDays} Days Max</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-600">${def.cost}</span>
                  </div>
                </div>
                
                {/* Edit Button */}
                <button 
                  onClick={() => handleEditClick(def)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:shadow-sm hover:text-indigo-600 rounded-md transition-all"
                  title="Edit Part Details"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              
              {/* Avg Health Indicator */}
              {installedInstances.length > 0 && (
                <div className="px-5 py-3 bg-white border-b border-slate-50">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1.5">
                    <span>Average Fleet Health</span>
                    <span className={avgHealth < 30 ? 'text-rose-500' : 'text-emerald-500'}>{avgHealth.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div 
                        className={`h-1 rounded-full ${avgHealth < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${avgHealth}%` }}
                    ></div>
                    </div>
                </div>
              )}

              <div className="flex-1 p-0 overflow-y-auto max-h-80 bg-white">
                <ul className="divide-y divide-slate-100">
                  {installedInstances.map(inst => (
                    <li key={inst.id} className="p-4 hover:bg-slate-50 transition-colors group/item">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{inst.machineName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">SN: {inst.partNumber}</span>
                          </div>
                        </div>
                        <StatusBadge status={inst.status} />
                      </div>
                      
                      <div className="flex items-center justify-between gap-3 mt-3">
                         <div className="flex-1">
                           <div className="flex justify-between text-[10px] mb-1 text-slate-400">
                              <span>Health ({inst.healthPercentage.toFixed(0)}%)</span>
                              <span>{inst.currentDaysUsed}d used</span>
                           </div>
                           <ProgressBar percentage={100 - inst.healthPercentage} status={inst.status} />
                         </div>
                         <button 
                            onClick={() => openReplaceModal(inst)}
                            className="p-2 bg-slate-50 hover:bg-white hover:shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg transition-all"
                            title="Replace Part"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                      </div>
                    </li>
                  ))}
                  {installedInstances.length === 0 && (
                    <li className="p-8 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 h-full">
                        <Package className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-sm">No active installs</span>
                    </li>
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
          onDelete={handleDelete}
        />
      </Modal>

      {/* Replace Confirmation Modal */}
      <Modal
        isOpen={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        title="Replace Component"
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