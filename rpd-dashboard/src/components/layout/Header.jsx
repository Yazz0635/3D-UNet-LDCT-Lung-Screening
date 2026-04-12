import React from 'react';
import { useAppContext } from '../../AppContext';
import { Activity, FlaskConical, Bell, CircleHelp, Wind, User } from 'lucide-react';
import clsx from 'clsx';

export default function Header() {
  const { appState, diagnosticResult, MOCK_PATIENT, setActiveModal } = useAppContext();

  // Banner properties mapping
  let bannerClass = "bg-muted text-white";
  let bannerIcon = <Activity className="w-4 h-4 mr-2" />;
  let bannerText = "Awaiting Upload...";
  let isPulsing = false;

  if (appState === 'processing') {
    bannerClass = "bg-primary text-white";
    bannerIcon = <Activity className="w-4 h-4 mr-2 animate-spin" />;
    bannerText = "Processing...";
    isPulsing = true;
  } else if (appState === 'ready') {
    if (diagnosticResult === 'tumor') {
      bannerClass = "bg-tumor text-white";
      bannerIcon = <FlaskConical className="w-4 h-4 mr-2" />; // Or alert triangle
      bannerText = "⚠ TUMOR DETECTED — Review Required";
      isPulsing = true; // small pulse effect 
    } else if (diagnosticResult === 'healthy') {
      bannerClass = "bg-healthy text-white";
      bannerIcon = <span className="mr-2">✓</span>;
      bannerText = "HEALTHY — No Suspicious Findings";
    }
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border z-20 flex-shrink-0">
      
      {/* Left: Branding */}
      <div className="flex items-center space-x-3">
        <Wind className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-primary font-bold text-lg leading-tight tracking-tight">RPD: AI Pulmonologist</h1>
          <p className="text-muted text-xs font-medium">3D Low-Dose CT Tumor Segmentation</p>
        </div>
      </div>

      {/* Center: Diagnostic Banner */}
      <div className="flex-1 flex justify-center items-center">
        <div 
          className={clsx(
            "flex items-center px-4 py-1.5 rounded-full shadow-sm text-sm font-semibold transition-all duration-300",
            bannerClass,
            isPulsing && appState === 'processing' ? "animate-pulse" : "",
            isPulsing && diagnosticResult === 'tumor' ? "shadow-[0_0_10px_rgba(239,68,68,0.4)]" : ""
          )}
        >
          {bannerIcon}
          {bannerText}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-5 text-text-primary">
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold">{appState === 'ready' ? MOCK_PATIENT.name : "No Patient"}</p>
          <p className="text-xs text-muted font-medium">{appState === 'ready' ? MOCK_PATIENT.id : "---"}</p>
        </div>
        <div className="flex items-center space-x-3 border-l border-border pl-5">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-muted hover:text-text-primary" title="Notifications">
            <Bell className="w-5 h-5" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-muted hover:text-text-primary" 
            title="Keyboard Shortcuts"
            onClick={() => setActiveModal('help')}
          >
            <CircleHelp className="w-5 h-5" />
          </button>
          <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors border border-border">
            <User className="w-5 h-5 text-text-primary" />
          </button>
        </div>
      </div>
      
    </header>
  );
}
