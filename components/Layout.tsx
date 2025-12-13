import React from 'react';
import { LayoutDashboard, Smartphone, Package, Search, ChevronRight } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'machines' | 'parts';
  onTabChange: (tab: 'dashboard' | 'machines' | 'parts') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'machines', label: 'Machines', icon: Smartphone },
    { id: 'parts', label: 'Parts Inventory', icon: Package },
  ] as const;

  return (
    <div className="min-h-screen flex bg-slate-50/50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-20 shadow-2xl shadow-slate-900/20">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Package className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              LifeCycle Pro
             </h1>
          </div>
          <p className="text-xs font-medium text-slate-500 ml-11">Industrial Part Manager</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
                  <span className="font-medium tracking-wide text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 m-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-inner border-2 border-slate-700">CQ</div>
            <div className="text-sm overflow-hidden">
              <p className="font-bold text-slate-200 truncate">Chaoqiang</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Admin • <span className="text-emerald-400 font-mono">v1.3</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};