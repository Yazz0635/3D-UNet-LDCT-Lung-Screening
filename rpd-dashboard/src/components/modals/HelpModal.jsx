import React from 'react';
import { useAppContext } from '../../AppContext';
import { X, Keyboard } from 'lucide-react';

export default function HelpModal() {
  const { setActiveModal } = useAppContext();

  const shortcuts = [
    { key: '← / →', desc: 'Previous / Next slice (step 1)' },
    { key: 'Shift + ←/→', desc: 'Step 5 slices' },
    { key: '[ / ]', desc: 'Decrease / Increase overlay opacity' },
    { key: 'B', desc: 'Toggle brightness panel' },
    { key: 'M', desc: 'Toggle AI mask visibility' },
    { key: 'S', desc: 'Toggle sync views' },
    { key: 'E', desc: 'Open Export modal' },
    { key: '?', desc: 'Open Help modal' },
    { key: 'Esc', desc: 'Close any open modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-border w-full max-w-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gray-50">
           <h2 className="text-lg font-bold text-text-primary flex items-center">
             <Keyboard className="w-5 h-5 mr-2 text-primary" />
             Keyboard Shortcuts
           </h2>
           <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-gray-200 rounded-md text-muted transition outline-none focus:ring-2 focus:ring-primary/50"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-y-2">
            {shortcuts.map((sc, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                <span className="text-sm font-medium text-gray-700">{sc.desc}</span>
                <kbd className="px-2.5 py-1 bg-white border border-border rounded shadow-sm text-[11px] font-mono font-bold text-gray-800 tracking-wider inline-flex items-center">{sc.key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
