import React, { useMemo, useRef, useState } from 'react';
import { PopulatedPart, PartStatus, Machine } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { AlertCircle, CheckCircle2, Activity, Zap, RefreshCw, Download, Upload, CalendarClock, TrendingUp, AlertTriangle } from 'lucide-react';
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

  // Get top 10 parts needing replacement (lowest health)
  const expiringParts = useMemo(() => {
    return [...parts]
      .sort((a, b) => a.healthPercentage - b.healthPercentage)
      .slice(0, 10);
  }, [parts]);

  const pieData = [
    { name: 'Good', value: stats.good, color: COLORS[PartStatus.GOOD] },
    { name: 'Warning', value: stats.warning, color: COLORS[PartStatus.WARNING] },
    { name: 'Critical', value: stats.critical, color: COLORS[PartStatus.CRITICAL] },
  ];

  // Calculate Average Health per Category
  const categoryHealthData = useMemo(() => {
    const data: Record<string, { category: string; totalHealth: number; count: number }> = {};
    parts.forEach(p => {
      const cat = p.definition.category;
      if (!data[cat]) data[cat] = { category: cat, totalHealth: 0, count: 0 };
      data[cat].totalHealth += p.healthPercentage;
      data[cat].count++;
    });
    return Object.values(data).map(item => ({
      category: item.category,
      avgHealth: Math.round(item.totalHealth / item.count)
    }));
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
    <div className="space-y-8 pb-10">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 tracking-tight">System Dashboard</h2>
           <p className="text-slate-500 mt-1">Real-time overview of your fleet's operational health.</p>
        </div>
        <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange}
            />
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                title="Import"
                >
                <Upload className="w-4 h-4" />
                </button>
                <div className="w-px bg-slate-200 my-1"></div>
                <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                title="Backup"
                >
                <Download className="w-4 h-4" />
                </button>
            </div>
            
            <button 
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all shadow-md shadow-indigo-200
                ${isGeneratingReport ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0'}`}
            >
            {isGeneratingReport ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
                <Zap className="w-5 h-5 fill-current" />
            )}
            {isGeneratingReport ? 'Analyzing...' : 'AI Analysis'}
            </button>
        </div>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Machines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
             <Activity className="w-24 h-24 text-blue-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
             <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Machines</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{machines.length}</p>
             </div>
             <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Activity className="w-6 h-6 text-blue-600" />
             </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-400">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <span>Active Fleet</span>
          </div>
        </div>
        
        {/* Parts Installed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
             <CheckCircle2 className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
             <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Parts</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
             </div>
             <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
             </div>
          </div>
           <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-400">
             <TrendingUp className="w-3 h-3 text-indigo-500" />
             <span>Tracking lifetime</span>
          </div>
        </div>

        {/* Critical */}
        <div className="bg-white p-6 rounded-2xl border border-red-50 shadow-sm hover:shadow-md hover:shadow-rose-100/50 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
             <AlertCircle className="w-24 h-24 text-rose-600" />
          </div>
          <div className="flex items-center justify-between relative z-10">
             <div>
                <p className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Critical</p>
                <p className="text-3xl font-bold text-rose-600 mt-1">{stats.critical}</p>
             </div>
             <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                <AlertCircle className="w-6 h-6 text-rose-600 animate-pulse" />
             </div>
          </div>
           <div className="mt-4 flex items-center gap-1 text-xs font-medium text-rose-400">
             <span>Requires immediate action</span>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-white p-6 rounded-2xl border border-amber-50 shadow-sm hover:shadow-md hover:shadow-amber-100/50 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
             <AlertTriangle className="w-24 h-24 text-amber-500" />
          </div>
          <div className="flex items-center justify-between relative z-10">
             <div>
                <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Warning</p>
                <p className="text-3xl font-bold text-amber-500 mt-1">{stats.warning}</p>
             </div>
             <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
             </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-400">
             <span>Monitor closely</span>
          </div>
        </div>
      </div>

      {/* 3. Charts Row - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                  Parts Health by Category (%)
              </h3>
              <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryHealthData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                          dataKey="category" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{fill: '#64748b', fontSize: 11, dy: 10}} 
                          interval={0}
                      />
                      <YAxis 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{fill: '#64748b'}} 
                          domain={[0, 100]}
                          unit="%"
                      />
                      <Tooltip 
                          cursor={{fill: '#f8fafc', radius: 4}} 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`${value}%`, 'Avg Health']}
                      />
                      <Bar 
                        name="Avg Health" 
                        dataKey="avgHealth" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]} 
                        barSize={40} 
                      />
                  </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>
                  Fleet Health Distribution
              </h3>
              <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      >
                      {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      </Pie>
                      <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                  </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* 4. Priority Replacements Table Row - Full Width */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                      <CalendarClock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800">Priority Replacements</h3>
                      <p className="text-xs text-slate-500">Components with lowest health remaining</p>
                  </div>
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
                      <tr>
                          <th className="px-6 py-4">Component</th>
                          <th className="px-6 py-4">Machine</th>
                          <th className="px-6 py-4">Install Date</th>
                          <th className="px-6 py-4">Health</th>
                          <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {expiringParts.map(part => (
                          <tr key={part.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-700">{part.definition.name}</div>
                                  <div className="text-xs font-mono text-slate-400 mt-0.5">{part.partNumber}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{part.machineName}</td>
                              <td className="px-6 py-4 text-slate-600">{new Date(part.installDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 w-64">
                                  <div className="flex flex-col gap-1.5">
                                      <div className="flex justify-between items-end">
                                            <span className={`text-xs font-bold ${part.status === PartStatus.CRITICAL ? 'text-rose-600' : part.status === PartStatus.WARNING ? 'text-amber-600' : 'text-emerald-600'}`}>
                                          {part.healthPercentage.toFixed(0)}%
                                          </span>
                                          <span className="text-[10px] text-slate-400">{part.currentDaysUsed}d used</span>
                                      </div>
                                      <ProgressBar percentage={100 - part.healthPercentage} status={part.status} />
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button 
                                      onClick={() => openReplaceModal(part)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                                  >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Replace
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {expiringParts.length === 0 && (
                          <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-100 mb-2" />
                                  <p>All systems operational. No immediate actions required.</p>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
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