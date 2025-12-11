import React, { useMemo } from 'react';
import { PopulatedPart, PartStatus, Machine } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { AlertCircle, CheckCircle2, Activity, Zap, RefreshCw } from 'lucide-react';

interface DashboardProps {
  parts: PopulatedPart[];
  machines: Machine[];
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

const COLORS = {
  [PartStatus.GOOD]: '#10b981',
  [PartStatus.WARNING]: '#f59e0b',
  [PartStatus.CRITICAL]: '#f43f5e',
};

export const Dashboard: React.FC<DashboardProps> = ({ parts, machines, onGenerateReport, isGeneratingReport }) => {
  const stats = useMemo(() => {
    const critical = parts.filter(p => p.status === PartStatus.CRITICAL).length;
    const warning = parts.filter(p => p.status === PartStatus.WARNING).length;
    const good = parts.filter(p => p.status === PartStatus.GOOD).length;
    return { critical, warning, good, total: parts.length };
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">System Dashboard</h2>
           <p className="text-slate-500">Real-time overview of fleet health.</p>
        </div>
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
    </div>
  );
};