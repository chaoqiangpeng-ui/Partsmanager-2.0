import React, { useState, useEffect } from 'react';
import { Machine } from '../../types';

interface MachineFormProps {
  initialData?: Machine;
  onSubmit: (machine: Omit<Machine, 'id'> | Machine) => void;
  onCancel: () => void;
}

export const MachineForm: React.FC<MachineFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    location: '',
    status: 'active' as Machine['status']
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        model: initialData.model,
        location: initialData.location,
        status: initialData.status
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Machine Name</label>
        <input
          required
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. CNC Router Alpha"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
        <input
          required
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.model}
          onChange={e => setFormData({ ...formData, model: e.target.value })}
          placeholder="e.g. X-2000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
        <input
          required
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.location}
          onChange={e => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g. Zone A"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.status}
          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
        >
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
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
          {initialData ? 'Update Machine' : 'Add Machine'}
        </button>
      </div>
    </form>
  );
};