import React from 'react';
import { AppProvider, useAppContext } from './AppContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainStage from './components/layout/MainStage';
import ExportModal from './components/modals/ExportModal';
import ModelSettingsModal from './components/modals/ModelSettingsModal';
import HelpModal from './components/modals/HelpModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Stub out Modals to prevent crash until phase 6
// We will replace these later.

// function ExportModal() { return null; }
// function ModelSettingsModal() { return null; }
// function HelpModal() { return null; }

function AppLayout() {
  const { activeModal } = useAppContext();
  
  // Apply globally
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-full flex-col bg-page text-text-primary overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <MainStage />
      </div>
      
      {activeModal === 'export' && <ExportModal />}
      {activeModal === 'settings' && <ModelSettingsModal />}
      {activeModal === 'help' && <HelpModal />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;
