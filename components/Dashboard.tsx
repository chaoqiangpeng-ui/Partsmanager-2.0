import React, { useMemo, useRef, useState } from 'react';
import { PopulatedPart, PartStatus, Machine } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { AlertCircle, CheckCircle2, Activity, Zap, RefreshCw, Download, Upload, CalendarClock } from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { ReplacePartForm } from './forms/ReplacePartForm';

interface DashboardProps {
  parts: PopulatedPart[];
  machines: Machine[];
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
  onReplacePart: (partId: string, newPartNumber: string, replaceDate?: string) => void;
}

const COLORS = {
  [PartStatus.GOOD]: '#10b981',
  [PartStatus.WARNING]: '#f59e0b',
  [PartStatus.CRITICAL]: '#f43f5e',
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  parts, 
  machines, 
  onGenerateReport, 
  isGeneratingReport,
  onExport,
  onImport,
  onReplacePart
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Replace Modal State
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [partToReplace, setPartToReplace] = useState<PopulatedPart | null>(null);

  const stats = useMemo(() => {
    const critical = parts.filter(p => p.status === PartStatus.CRITICAL).length;
    const warning = parts.filter(p => p.status === PartStatus.WARNING).length;
    const good = parts.filter(p => p.status === PartStatus.GOOD).length;
    return { critical, warning, good, total: parts.length };
  }, [parts]);

  // Get top 5 parts needing replacement (lowest health)
  const expiringParts = useMemo(() => {
    return [...parts]
      .sort((a, b) => a.healthPercentage - b.healthPercentage)
      .slice(0, 5);
  }, [parts]);

  const pieData = [
    { name: 'Good', value: stats.good, color: COLORS[PartStatus.GOOD] },
    { name: 'Warning', value: stats.warning, color: COLORS[PartStatus.WARNING] },
    { name: 'Critical', value: stats.critical, color: COLORS[PartStatus.CRITICAL] },
  ];

  const categoryData = useMemo(() => {
    const data: Record<string, { category: string; critical: number; warning: number }> = {};
    parts.forEach(p => {
      const cat = p.definition.category;
      if (!data[cat]) data[cat] = { category: cat, critical: 0, warning: 0 };
      if (p.status === PartStatus.CRITICAL) data[cat].critical++;
      if (p.status === PartStatus.WARNING) data[cat].warning++;
    });
    return Object.values(data);
  }, [parts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openReplaceModal = (part: PopulatedPart) => {
    setPartToReplace(part);
    setReplaceModalOpen(true);
  };

  const handleReplaceSubmit = (partId: string, newPartNumber: string, replaceDate?: string) => {
    onReplacePart(partId, newPartNumber, replaceDate);
    setReplaceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">System Dashboard</h2>
           <p className="text-slate-500">Real-time overview of fleet health.</p>
        </div>
        <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
              <Upload className="w-4 h-4" /> Import Data
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Backup Data
            </button>
            <div className="w-px h-8 bg-slate-300 mx-1"></div>
            <button 
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all shadow-md
                ${isGeneratingReport ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'}`}
            >
            {isGeneratingReport ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
                <Zap className="w-5 h-5" />
            )}
            {isGeneratingReport ? 'Analyzing...' : 'AI Health Analysis'}
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Machines</p>
            <p className="text-3xl font-bold text-slate-800">{machines.length}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg"><Activity className="w-6 h-6 text-blue-600" /></div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Parts Installed</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg"><CheckCircle2 className="w-6 h-6 text-indigo-600" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-rose-500">Critical Attention</p>
            <p className="text-3xl font-bold text-rose-600">{stats.critical}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg"><AlertCircle className="w-6 h-6 text-rose-600" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-500">Warning Stage</p>
            <p className="text-3xl font-bold text-amber-600">{stats.warning}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg"><Activity className="w-6 h-6 text-amber-600" /></div>
        </div>
      </div>

      {/* Maintenance Forecast Row */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-700">Upcoming Replacements (Lowest Health)</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">Part Name</th>
                        <th className="px-4 py-3">Machine</th>
                        <th className="px-4 py-3">Install Date</th>
                        <th className="px-4 py-3">Lifetime Used</th>
                        <th className="px-4 py-3">Health</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {expiringParts.map(part => (
                        <tr key={part.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">
                                {part.definition.name}
                                <span className="ml-2 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{part.partNumber}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{part.machineName}</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(part.installDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-600">
                                {part.currentDaysUsed} / {part.definition.maxLifetimeDays} days
                            </td>
                            <td className="px-4 py-3 w-48">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <ProgressBar percentage={100 - part.healthPercentage} status={part.status} />
                                    </div>
                                    <span className={`text-xs font-bold ${part.status === PartStatus.CRITICAL ? 'text-rose-600' : part.status === PartStatus.WARNING ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {part.healthPercentage.toFixed(0)}%
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button 
                                    onClick={() => openReplaceModal(part)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Replace
                                </button>
                            </td>
                        </tr>
                    ))}
                     {expiringParts.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-slate-400">System is healthy. No immediate replacements needed.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6">Overall Part Health</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-6">Issues by Category</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="category" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Legend />
                <Bar dataKey="critical" stackId="a" fill={COLORS[PartStatus.CRITICAL]} radius={[0, 0, 4, 4]} />
                <Bar dataKey="warning" stackId="a" fill={COLORS[PartStatus.WARNING]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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