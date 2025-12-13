import React, { useState, useEffect } from 'react';
import { PartDefinition } from '../../types';
import { Trash2 } from 'lucide-react';

interface PartDefinitionFormProps {
  initialData?: PartDefinition;
  onSubmit: (def: Omit<PartDefinition, 'id'> | PartDefinition) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export const PartDefinitionForm: React.FC<PartDefinitionFormProps> = ({ initialData, onSubmit, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    maxLifetimeDays: 365,
    cost: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        maxLifetimeDays: initialData.maxLifetimeDays,
        cost: initialData.cost
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      onSubmit({ ...initialData, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Part Name</label>
        <input
          required
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Spindle Bearing"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <input
          required
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.category}
          onChange={e => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g. Mechanical"
          list="categories"
        />
        <datalist id="categories">
            <option value="Mechanical" />
            <option value="Electrical" />
            <option value="Hydraulic" />
            <option value="Consumable" />
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Lifetime (Days)</label>
            <input
            required
            type="number"
            min="1"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.maxLifetimeDays}
            onChange={e => setFormData({ ...formData, maxLifetimeDays: parseInt(e.target.value) || 0 })}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
            <input
            required
            type="number"
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.cost}
            onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
            />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
        <div>
            {initialData && onDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(initialData.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Type
                </button>
            )}
        </div>
        <div className="flex gap-3">
            <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
            Cancel
            </button>
            <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
            {initialData ? 'Update Part' : 'Create Part Type'}
            </button>
        </div>
      </div>
    </form>
  );
};