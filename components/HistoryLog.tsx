import React from 'react';
import { MaintenanceLog } from '../types';
import { History } from 'lucide-react';

interface HistoryLogProps {
  logs: MaintenanceLog[];
  machineName?: string;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ logs, machineName }) => {
  // Sort logs by date descending
  const sortedLogs = [...logs].sort((a, b) => new Date(b.replacedDate).getTime() - new Date(a.replacedDate).getTime());

  if (sortedLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <History className="w-12 h-12 mb-2 opacity-20" />
        <p>No replacement history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {machineName && (
        <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Showing history for: <span className="font-bold text-slate-800">{machineName}</span></p>
        </div>
      )}
      
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Part Name</th>
              <th className="px-4 py-3">Old S/N</th>
              <th className="px-4 py-3">New S/N</th>
              <th className="px-4 py-3">Usage at Replacement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">
                  {new Date(log.replacedDate).toLocaleDateString()}
                  <div className="text-xs text-slate-400">{new Date(log.replacedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{log.partName}</td>
                <td className="px-4 py-3 text-rose-600 font-mono text-xs">{log.oldPartNumber}</td>
                <td className="px-4 py-3 text-emerald-600 font-mono text-xs">{log.newPartNumber}</td>
                <td className="px-4 py-3 text-slate-600">{log.daysUsedAtReplacement} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};