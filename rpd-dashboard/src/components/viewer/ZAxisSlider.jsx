import React from 'react';
import { useAppContext } from '../../AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ZAxisSlider() {
  const { currentSlice, setCurrentSlice, rawBoxes, confidenceThreshold } = useAppContext();

  const handlePrev = () => setCurrentSlice(s => Math.max(0, s - 1));
  const handleNext = () => setCurrentSlice(s => Math.min(95, s + 1));

  // Determine slices that have tumors to render yellow dots
  const tumorSlices = [];
  if (rawBoxes && rawBoxes.length === 96) {
    for (let i = 0; i < 96; i++) {
      if (rawBoxes[i].some(b => b.confidence >= confidenceThreshold)) {
        tumorSlices.push(i);
      }
    }
  }

  return (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center mb-1">
      <div className="flex-shrink-0 w-40 text-sm font-semibold tracking-wide text-primary border-r border-border pr-2">
        <span className="block text-gray-800">Z-Axis Depth</span>
        <span className="text-muted text-xs font-medium">Slice {currentSlice} / 95</span>
      </div>
      
      <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg mx-2 transition-colors border border-transparent hover:border-border">
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex-1 relative mx-2 h-10 flex items-center">
        {/* Track */}
        <div className="absolute left-0 right-0 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-primary" 
            style={{ width: `${(currentSlice / 95) * 100}%` }} 
          />
        </div>

        {/* Tumor Indicators */}
        {tumorSlices.map(sliceIdx => {
          const leftPercent = (sliceIdx / 95) * 100;
          return (
            <div 
              key={sliceIdx}
              className="absolute w-1.5 h-3 bg-bbox rounded-full -mt-0.5 shadow-sm"
              style={{ left: `calc(${leftPercent}% - 0.1875rem)`, top: '50%', transform: 'translateY(-50%)' }}
              title={`Tumor reported near slice ${sliceIdx}`}
            />
          );
        })}

        {/* Range Input (Invisible overlay for native dragging) */}
        <input 
          type="range" 
          min="0" max="95" 
          value={currentSlice}
          onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Visual Thumb */}
        <div 
          className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow pointer-events-none"
          style={{ left: `calc(${(currentSlice / 95) * 100}% - 0.5rem)`, top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>

      <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-lg mx-2 transition-colors border border-transparent hover:border-border">
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}
