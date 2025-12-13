import React from 'react';
import { PartStatus } from '../../types';

interface ProgressBarProps {
  percentage: number;
  status: PartStatus;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, status }) => {
  let colorClass = 'bg-emerald-500';
  if (status === PartStatus.WARNING) colorClass = 'bg-amber-500';
  if (status === PartStatus.CRITICAL) colorClass = 'bg-rose-500';

  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
      <div 
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass} shadow-sm`} 
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      ></div>
    </div>
  );
};