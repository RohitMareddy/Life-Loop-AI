import React from 'react';
import { Bot, Play, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenAssistant }) => {
  const { activeTab, setActiveTab, setTourStep, searchQuery, setSearchQuery } = useApp();

  const primaryLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'optimizer', label: 'Impact Optimizer' },
    { id: 'intake', label: 'AI Intake' },
    { id: 'observatory', label: 'Observatory' },
    { id: 'simulator', label: 'Simulation' },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between gap-8 shrink-0 sticky top-0 z-20">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('overview');
          }}
          className="text-[19px] font-extrabold tracking-tight text-[#111A15] whitespace-nowrap shrink-0 hover:text-[#176B4D] transition-colors font-display"
        >
          LIFELOOP AI
        </a>
        <span className="hidden lg:inline text-xs text-[#7A867E] font-medium tracking-normal">
          / Give Every Useful Resource Another Chance
        </span>
      </div>

      {/* Zone 2: 4-5 Concise Single-line Nav Links + Quick Search */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5563] flex-1 max-w-xl">
        <nav className="flex items-center gap-5 shrink-0">
          {primaryLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`whitespace-nowrap transition-colors text-[13.5px] ${
                  isActive
                    ? 'text-[#176B4D] font-bold border-b-2 border-[#176B4D] py-1'
                    : 'text-[#58645C] hover:text-[#111A15] font-semibold'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Global Filter/Search */}
        <div className="relative w-full max-w-xs ml-auto">
          <Search className="w-3.5 h-3.5 text-[#8A958E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources, requests..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F8F4] border border-[#E5E7EB] rounded-md text-[#17231D] placeholder-[#8A958E] focus:outline-none focus:border-[#176B4D] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Zone 3: 1 Primary Action + Assistant */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#176B4D] bg-[#F0F6F2] hover:bg-[#E2EDE5] rounded-lg transition-colors whitespace-nowrap shrink-0 border border-[#D1E3D7]"
          title="Open grounded Loop Assistant copilot"
        >
          <Bot className="w-4 h-4 text-[#176B4D]" />
          <span className="hidden sm:inline">Loop Assistant</span>
        </button>

        <button
          onClick={() => setTourStep(0)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>See in Action</span>
        </button>
      </div>
    </header>
  );
};
