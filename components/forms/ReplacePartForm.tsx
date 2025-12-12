import React, { useState } from 'react';
import { PopulatedPart } from '../../types';
import { AlertTriangle, Calendar } from 'lucide-react';

interface ReplacePartFormProps {
  part: PopulatedPart;
  onConfirm: (partId: string, newPartNumber: string, replaceDate: string) => void;
  onCancel: () => void;
}

export const ReplacePartForm: React.FC<ReplacePartFormProps> = ({ part, onConfirm, onCancel }) => {
  const [newPartNumber, setNewPartNumber] = useState('');
  // Default to today's date
  const [replaceDate, setReplaceDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(part.id, newPartNumber, replaceDate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-800">Confirm Replacement</h4>
          <p className="text-xs text-amber-700 mt-1">
            You are about to replace <strong>{part.definition.name}</strong> (Current SN: {part.partNumber}).
            This action will log the current part to history and reset usage statistics.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">New Part Number / Serial Number</label>
        <input
          required
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newPartNumber}
          onChange={e => setNewPartNumber(e.target.value)}
          placeholder="e.g. SN-9988-X"
          autoFocus
        />
        <p className="text-xs text-slate-400 mt-1">Enter the identifier found on the new component.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Replacement Date (Update Install Time)
        </label>
        <input
          required
          type="date"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={replaceDate}
          onChange={e => setReplaceDate(e.target.value)}
        />
        <p className="text-xs text-slate-400 mt-1">This will be recorded as the new installation date.</p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
        >
          Confirm & Replace
        </button>
      </div>
    </form>
  );
};