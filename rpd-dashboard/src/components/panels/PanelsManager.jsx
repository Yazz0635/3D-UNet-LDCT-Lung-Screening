import React from 'react';
import { useAppContext } from '../../AppContext';
import PatientInfoPanel from './PatientInfoPanel';
import BoundingBoxList from './BoundingBoxList';
import AnnotationsPanel from './AnnotationsPanel';
import clsx from 'clsx';
import { SquareUser, Focus, FileSignature } from 'lucide-react';

export default function PanelsManager() {
  const { activeTab, setActiveTab, findings, appState } = useAppContext();

  if (appState === 'idle') return null;

  const tabs = [
    { id: 'patient', label: 'Patient Info', icon: <SquareUser className="w-4 h-4 mr-2" /> },
    { id: 'findings', label: `Detected Findings (${findings.length})`, icon: <Focus className="w-4 h-4 mr-2" /> },
    { id: 'annotations', label: 'Clinical Annotations', icon: <FileSignature className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex border-b border-border bg-gray-50 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center px-5 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === tab.id 
                ? "border-primary text-primary bg-white" 
                : "border-transparent text-muted hover:text-text-primary hover:bg-gray-200"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden p-0 relative">
        {activeTab === 'patient' && <PatientInfoPanel />}
        {activeTab === 'findings' && <BoundingBoxList />}
        {activeTab === 'annotations' && <AnnotationsPanel />}
      </div>
    </div>
  );
}
