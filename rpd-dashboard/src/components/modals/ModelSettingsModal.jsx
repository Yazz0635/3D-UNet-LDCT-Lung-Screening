import React from 'react';
import { useAppContext } from '../../AppContext';
import { X, Settings } from 'lucide-react';

export default function ModelSettingsModal() {
  const { setActiveModal, confidenceThreshold, setConfidenceThreshold } = useAppContext();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-lg flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gray-50">
           <h2 className="text-lg font-bold text-text-primary flex items-center">
             <Settings className="w-5 h-5 mr-2 text-primary" />
             Model Configuration
           </h2>
           <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-gray-200 rounded-md text-muted transition outline-none focus:ring-2 focus:ring-primary/50"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6">
           <div className="grid grid-cols-2 gap-5 mb-8 text-sm bg-gray-50 p-4 rounded-xl border border-border">
             <div>
               <span className="block text-[10px] items-center font-bold text-muted uppercase tracking-wider mb-1">Model Name</span>
               <span className="font-bold text-text-primary">3D U-Net (PyTorch)</span>
             </div>
             <div>
               <span className="block text-[10px] items-center font-bold text-muted uppercase tracking-wider mb-1">Base Version</span>
               <span className="font-bold text-primary bg-blue-100 px-2 py-0.5 rounded ml-[-6px]">production_v2</span>
             </div>
             <div>
               <span className="block text-[10px] items-center font-bold text-muted uppercase tracking-wider mb-1">Architecture</span>
               <span className="font-medium text-text-primary">Channels: 16,32,64,128</span>
             </div>
             <div>
               <span className="block text-[10px] items-center font-bold text-muted uppercase tracking-wider mb-1">Loss Function</span>
               <span className="font-medium text-text-primary">DiceCELoss</span>
             </div>
             <div className="col-span-2 border-t border-gray-200 pt-3">
               <span className="block text-[10px] items-center font-bold text-muted uppercase tracking-wider mb-1">Volumetric Input Shape</span>
               <span className="font-mono text-xs font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded">96 × 96 × 96</span>
             </div>
           </div>

           <div className="pt-2">
             <div className="flex justify-between items-center mb-1">
                 <span className="font-bold text-sm text-text-primary">Confidence Threshold</span>
                 <span className="font-bold text-primary bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-sm relative -top-1">{confidenceThreshold}%</span>
             </div>
             <p className="text-xs text-muted mb-4 font-medium leading-relaxed">Adjusting this slider updates the bounding box sensitivity globally. Lower values increase recall but may introduce false positives.</p>
             <input 
                type="range" min="0" max="100" 
                value={confidenceThreshold} 
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2" 
             />
             <div className="flex justify-between text-[10px] text-muted mt-3 font-bold uppercase tracking-wider">
               <span>High Sensitivity (0%)</span>
               <span>High Specificity (100%)</span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
