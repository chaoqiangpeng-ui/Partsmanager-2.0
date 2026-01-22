import React, { useMemo, useRef, useState } from 'react';
import { PopulatedPart, PartStatus, Machine } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Sector } from 'recharts';
import { AlertCircle, CheckCircle2, Activity, Zap, RefreshCw, Download, Upload, CalendarClock, TrendingUp, AlertTriangle, Layers, Box } from 'lucide-react';
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

// Custom Label Component for Pie Chart
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, color } = props;
  const RADIAN = Math.PI / 180;
  
  if (value === 0) return null;

  // Calculate positions
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      {/* Line */}
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} fill="none" strokeWidth={1.5} />
      {/* Dot at end of line */}
      <circle cx={ex} cy={ey} r={3} fill={color} stroke="none" />
      {/* Title */}
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#334155" dy={-6} fontSize={13} fontWeight="bold">
        {name}
      </text>
      {/* Description */}
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#64748b" dy={12} fontSize={11}>
        {`${(percent * 100).toFixed(0)}% (${value} items)`}
      </text>
    </g>
  );
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
    const data: Record<string, { category: string; critical: number; warning: number; good: number }> = {};
    parts.forEach(p => {
      const cat = p.definition.category;
      if (!data[cat]) data[cat] = { category: cat, critical: 0, warning: 0, good: 0 };
      if (p.status === PartStatus.CRITICAL) data[cat].critical++;
      else if (p.status === PartStatus.WARNING) data[cat].warning++;
      else data[cat].good++;
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Dashboard</h2>
           <p className="text-slate-500 text-sm">Real-time overview of your fleet's operational health.</p>
        </div>
        <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange}
            />
            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-medium"
                title="Import"
                >
                <Upload className="w-3.5 h-3.5" />
                Import
                </button>
                <div className="w-px bg-slate-200 my-1 mx-1"></div>
                <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 rounded-md hover:bg-white hover:shadow-sm transition-all text-xs font-medium"
                title="Backup"
                >
                <Download className="w-3.5 h-3.5" />
                Export
                </button>
            </div>
            
            <button 
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm transition-all shadow-md shadow-indigo-100
                ${isGeneratingReport ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5'}`}
            >
            {isGeneratingReport ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
                <Zap className="w-4 h-4 fill-current" />
            )}
            {isGeneratingReport ? 'Analyzing...' : 'AI Analysis'}
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Machines - Blue */}
        <div className="bg-white rounded-lg p-0 shadow-sm border border-slate-100 flex overflow-hidden h-28 hover:shadow-md transition-shadow">
          <div className="w-24 bg-blue-500 flex items-center justify-center shrink-0">
             <Activity className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 p-5 flex flex-col justify-center">
             <div className="text-4xl font-bold text-slate-800">{machines.length}</div>
             <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">Total Machines</div>
          </div>
        </div>
        
        {/* Total Parts - Green */}
        <div className="bg-white rounded-lg p-0 shadow-sm border border-slate-100 flex overflow-hidden h-28 hover:shadow-md transition-shadow">
          <div className="w-24 bg-emerald-500 flex items-center justify-center shrink-0">
             <Layers className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 p-5 flex flex-col justify-center">
             <div className="text-4xl font-bold text-slate-800">{stats.total}</div>
             <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">Installed Parts</div>
          </div>
        </div>

        {/* Warning - Orange */}
        <div className="bg-white rounded-lg p-0 shadow-sm border border-slate-100 flex overflow-hidden h-28 hover:shadow-md transition-shadow">
          <div className="w-24 bg-amber-500 flex items-center justify-center shrink-0">
             <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 p-5 flex flex-col justify-center">
             <div className="text-4xl font-bold text-slate-800">{stats.warning}</div>
             <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">Warnings</div>
          </div>
        </div>

        {/* Critical - Red */}
        <div className="bg-white rounded-lg p-0 shadow-sm border border-slate-100 flex overflow-hidden h-28 hover:shadow-md transition-shadow">
          <div className="w-24 bg-rose-500 flex items-center justify-center shrink-0">
             <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 p-5 flex flex-col justify-center">
             <div className="text-4xl font-bold text-slate-800">{stats.critical}</div>
             <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">Critical Issues</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-500"></span>
                Part Health by Category
            </h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="category" fontSize={12} tickLine={false} axisLine={{stroke: '#e2e8f0'}} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip 
                        cursor={{fill: '#f8fafc', radius: 4}} 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar name="Good" dataKey="good" stackId="a" fill={COLORS[PartStatus.GOOD]} radius={[0, 0, 0, 0]} />
                    <Bar name="Warning" dataKey="warning" stackId="a" fill={COLORS[PartStatus.WARNING]} radius={[0, 0, 0, 0]} />
                    <Bar name="Critical" dataKey="critical" stackId="a" fill={COLORS[PartStatus.CRITICAL]} radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Fleet Health Pie Chart - Updated Layout */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500"></span>
                Overall Health Distribution
            </h3>
            <div className="flex-1 min-h-[300px] w-full flex items-center justify-center -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    innerRadius={40} // Small inner radius for a modern "solid" feel but not full donut
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Priority Replacements Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-lg">
                    <CalendarClock className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Priority Replacements</h3>
                    <p className="text-xs text-slate-500">Components approaching end of life cycle</p>
                </div>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4">Component</th>
                        <th className="px-6 py-4">Machine</th>
                        <th className="px-6 py-4">Install Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Health Remaining</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {expiringParts.map(part => (
                        <tr key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded text-slate-500">
                                        <Box className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-700">{part.definition.name}</div>
                                        <div className="text-xs font-mono text-slate-400 mt-0.5">{part.partNumber}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{part.machineName}</td>
                            <td className="px-6 py-4 text-slate-600">
                                {new Date(part.installDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                    ${part.status === PartStatus.CRITICAL ? 'bg-rose-100 text-rose-800' : 
                                      part.status === PartStatus.WARNING ? 'bg-amber-100 text-amber-800' : 
                                      'bg-emerald-100 text-emerald-800'}`}>
                                    {part.status.toLowerCase()}
                                </span>
                            </td>
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Replace
                                </button>
                            </td>
                        </tr>
                    ))}
                    {expiringParts.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center justify-center">
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