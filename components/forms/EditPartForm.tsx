import React, { useState } from 'react';
import { InstalledPart } from '../../types';

interface EditPartFormProps {
  part: InstalledPart;
  partName: string;
  onSubmit: (partId: string, updates: Partial<InstalledPart>) => void;
  onCancel: () => void;
}

export const EditPartForm: React.FC<EditPartFormProps> = ({ part, partName, onSubmit, onCancel }) => {
  // Safe date parsing helper
  const getInitialDate = (dateStr: string) => {
    try {
      if (!dateStr) return new Date().toISOString().split('T')[0];
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      return d.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const initialDate = getInitialDate(part.installDate);
  
  const [installDate, setInstallDate] = useState(initialDate);
  const [daysUsed, setDaysUsed] = useState(part.currentDaysUsed);
  const [autoSync, setAutoSync] = useState(true);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setInstallDate(newDate);

    if (autoSync && newDate) {
      // Create date at midnight local time to avoid timezone offsets issues with simple date inputs
      const now = new Date();
      const start = new Date(newDate);
      
      if (!isNaN(start.getTime())) {
          // Calculate difference in milliseconds
          const diffMs = now.getTime() - start.getTime();
          // Convert to days
          const estimatedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          setDaysUsed(estimatedDays);
      }
    }
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDaysUsed(parseInt(e.target.value) || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        // Create a new date object from the input string
        const newDateIso = new Date(installDate).toISOString();
        
        onSubmit(part.id, {
          installDate: newDateIso,
          currentDaysUsed: daysUsed
        });
    } catch (e) {
        console.error("Invalid date submitted");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
        <p className="text-xs text-slate-500 uppercase font-semibold">Editing Component</p>
        <p className="text-sm font-bold text-slate-800">{partName}</p>
        <p className="text-xs text-slate-400 font-mono mt-1">ID: {part.id}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Installation Date</label>
        <input
          required
          type="date"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={installDate}
          onChange={handleDateChange}
        />
        <div className="mt-2 flex items-center gap-2">
          <input 
            type="checkbox" 
            id="autoSync"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoSync" className="text-xs text-slate-500 cursor-pointer select-none">
            Auto-update "Days Used" based on date
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Current Days Used</label>
        <input
          required
          type="number"
          min="0"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={daysUsed}
          onChange={handleDaysChange}
        />
        <p className="text-xs text-slate-500 mt-1">
          {autoSync ? 'Calculated automatically. ' : ''}
          Used to calculate remaining lifetime health.
        </p>
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
          Save Changes
        </button>
      </div>
    </form>
  );
};