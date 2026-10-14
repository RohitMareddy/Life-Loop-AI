import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Sparkles,
  ClipboardList,
  GitCompare,
  TrendingUp,
  Truck,
  BarChart3,
  Sliders,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, resetDemoData, resources, requests } = useApp();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'inventory',
      label: 'Resource Inventory',
      icon: Boxes,
      badge: resources.filter((r) => r.status === 'available').length,
    },
    { id: 'intake', label: 'Smart Intake (AI)', icon: Sparkles, highlight: true },
    {
      id: 'requests',
      label: 'Community Requests',
      icon: ClipboardList,
      badge: requests.filter((r) => r.status !== 'fulfilled' && r.status !== 'closed').length,
    },
    { id: 'matching', label: 'Smart Matching', icon: GitCompare },
    { id: 'optimizer', label: 'Impact Optimizer', icon: TrendingUp, star: true },
    { id: 'distribution', label: 'Distribution Planner', icon: Truck },
    { id: 'observatory', label: 'Impact Observatory', icon: BarChart3 },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
  ];

  const handleReset = () => {
    if (window.confirm('Reset demo data to initial Greenfield Community Network state?')) {
      resetDemoData();
    }
  };

  return (
    <aside className="w-64 bg-[#FBFBFA] border-r border-[#E5E7EB] flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#E5E7EB] gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#176B4D] text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs font-display">
          L
        </div>
        <div>
          <span className="font-extrabold text-[16px] tracking-tight text-[#111A15] block leading-none font-display">
            LIFELOOP AI
          </span>
          <span className="text-[11px] text-[#66736A] font-semibold tracking-normal leading-tight">
            Community Resource Engine
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-[#7C8880] uppercase">
          Coordination
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-[13.5px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#176B4D] text-white shadow-xs font-bold'
                  : 'text-[#35433A] hover:bg-[#EEF1EB] hover:text-[#111A15]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : item.highlight ? 'text-[#176B4D]' : 'text-[#66736A]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E3E7DE] text-[#2F3C34]'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.star && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#176B4D]"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Trust & Network Indicator */}
      <div className="p-3 border-t border-[#E5E7EB] space-y-2">
        <div className="px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#66736A]">Active Network</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              DEMO
            </span>
          </div>
          <p className="text-[12px] font-semibold text-[#17231D] truncate">
            Greenfield Community Network
          </p>
        </div>

        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#66736A] hover:text-[#17231D] hover:bg-[#EEF1EB] rounded-lg transition-colors"
          title="Restore original Greenfield demonstration dataset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
};
