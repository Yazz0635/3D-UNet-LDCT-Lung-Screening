import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';

export default function AnnotationsPanel() {
  const { annotations, setAnnotations } = useAppContext();
  const [localText, setLocalText] = useState(annotations);
  const [savedTime, setSavedTime] = useState(null);

  const handleSave = () => {
    setAnnotations(localText);
    setSavedTime(new Date().toLocaleTimeString());
  };

  return (
    <div className="h-full flex flex-col p-4 bg-white relative">
      <textarea 
        className="flex-1 w-full p-3 border border-border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-colors text-gray-800 placeholder-gray-400"
        placeholder="Enter clinical observations, staging notes, and actionable recommendations here..."
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
      />
      <div className="flex justify-between items-center mt-3 shrink-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {savedTime ? <span className="text-green-600">✓ Last saved at {savedTime}</span> : (localText !== annotations ? <span className="text-yellow-600">Unsaved changes</span> : "Up to date")}
        </div>
        <div className="flex space-x-2">
           <button 
             onClick={() => setLocalText(annotations)}
             className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-md transition border border-transparent hover:border-gray-200"
             disabled={localText === annotations}
           >
             Discard
           </button>
           <button 
             onClick={handleSave}
             className="px-6 py-1.5 text-xs font-bold bg-primary text-white hover:bg-blue-800 rounded-md shadow transition disabled:opacity-50"
             disabled={localText === annotations}
           >
             Save Note
           </button>
        </div>
      </div>
    </div>
  );
}
