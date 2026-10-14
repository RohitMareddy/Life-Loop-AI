import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { EvaluatorTourModal } from './components/EvaluatorTourModal';
import { LoopAssistantDrawer } from './components/LoopAssistantDrawer';
import { OverviewView } from './components/views/OverviewView';
import { InventoryView } from './components/views/InventoryView';
import { IntakeView } from './components/views/IntakeView';
import { RequestsView } from './components/views/RequestsView';
import { MatchingView } from './components/views/MatchingView';
import { OptimizerView } from './components/views/OptimizerView';
import { DistributionView } from './components/views/DistributionView';
import { ObservatoryView } from './components/views/ObservatoryView';
import { SimulatorView } from './components/views/SimulatorView';
import { Menu, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'inventory':
        return <InventoryView />;
      case 'intake':
        return <IntakeView />;
      case 'requests':
        return <RequestsView />;
      case 'matching':
        return <MatchingView />;
      case 'optimizer':
        return <OptimizerView />;
      case 'distribution':
        return <DistributionView />;
      case 'observatory':
        return <ObservatoryView />;
      case 'simulator':
        return <SimulatorView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8F4] text-[#17231D] font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-[#66736A] hover:text-[#17231D] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Mobile Header Bar Toggle */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-[#E5E7EB]">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-[#3D4A41] hover:bg-[#F3F5F1] rounded-lg"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-[#176B4D]">LIFELOOP AI</span>
          <div className="w-8" />
        </div>

        {/* Global Top Bar */}
        <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Evaluator Guided 2-Minute Walkthrough Modal */}
      <EvaluatorTourModal />

      {/* Contextual Loop Assistant Drawer */}
      <LoopAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
