import React from 'react';
import { PartStatus } from '../../types';

interface BadgeProps {
  status: PartStatus | string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  switch (status) {
    case PartStatus.GOOD:
    case 'active':
      colorClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      break;
    case PartStatus.WARNING:
    case 'maintenance':
      colorClass = 'bg-amber-100 text-amber-800 border border-amber-200';
      break;
    case PartStatus.CRITICAL:
    case 'offline':
      colorClass = 'bg-rose-100 text-rose-800 border border-rose-200';
      break;
    default:
      colorClass = 'bg-slate-100 text-slate-800 border border-slate-200';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${colorClass}`}>
      {status}
    </span>
  );
};