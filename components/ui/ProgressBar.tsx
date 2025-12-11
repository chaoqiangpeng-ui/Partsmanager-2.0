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
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div 
        className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`} 
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      ></div>
    </div>
  );
};