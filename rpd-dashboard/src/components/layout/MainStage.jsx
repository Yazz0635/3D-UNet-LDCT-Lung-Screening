import React from 'react';
import ZAxisSlider from '../viewer/ZAxisSlider';
import CTViewer from '../viewer/CTViewer';
import AIOverlayViewer from '../viewer/AIOverlayViewer';
import PanelsManager from '../panels/PanelsManager';
import { useAppContext } from '../../AppContext';

export default function MainStage() {
  const { appState } = useAppContext();

  if (appState === 'idle') {
    return (
      <main className="flex-1 flex flex-col bg-page p-6 overflow-hidden items-center justify-center relative">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center opacity-60 shadow-inner">
             <span className="text-4xl text-gray-400">🩻</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">No Scan Uploaded</h2>
          <p className="text-sm text-muted">Use the sidebar to upload a 3D NIfTI file to begin AI tumor analysis.</p>
        </div>
      </main>
    );
  }

  // Covers 'uploading', 'processing', and 'ready'
  return (
    <main className="flex-1 flex flex-col bg-page p-4 overflow-y-auto space-y-4 min-w-0">
      
      {/* Top Slider Row */}
      <div className="flex-shrink-0">
        <ZAxisSlider />
      </div>
      
      {/* Middle Viewers Row - CHANGED: min-h-[500px] forces the boxes to be tall */}
      <div className="flex-1 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 min-h-[500px] overflow-hidden">
        <CTViewer />
        <AIOverlayViewer />
      </div>
      
      {/* Bottom Panels Row */}
      <div className="h-64 flex-shrink-0 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        <PanelsManager />
      </div>
      
    </main>
  );
}
