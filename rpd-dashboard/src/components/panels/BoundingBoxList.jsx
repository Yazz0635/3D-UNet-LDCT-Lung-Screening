import React from 'react';
import { useAppContext } from '../../AppContext';
import { Check, X, Flag } from 'lucide-react';
import clsx from 'clsx';

export default function BoundingBoxList() {
  const { findings, setFindings, setCurrentSlice } = useAppContext();

  const handleAction = (e, id, type) => {
    e.stopPropagation();
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: type } : f));
  };

  const jumpToSlice = (rangeStr) => {
    const targetStr = String(rangeStr).split(/[-–]/)[0];
    const target = parseInt(targetStr) || 40;
    setCurrentSlice(target + 2); // Jump slightly into the middle of the range if possible
  };

  if (findings.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted bg-white p-6">
        <Check className="w-8 h-8 text-green-500 mb-2 opacity-50" />
        <p className="font-medium">No suspicious findings detected.</p>
        <p className="text-xs">The model did not identify any structures meeting the confidence threshold.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-border sticky top-0 z-10 text-[10px] font-bold text-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Slice Range</th>
              <th className="px-4 py-3">Semantic Location</th>
              <th className="px-4 py-3">Estimated Size</th>
              <th className="px-4 py-3">AI Confidence</th>
              <th className="px-4 py-3 w-32 text-center">Clinical Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {findings.map((finding) => {
              const bgRow = "bg-white";
              const conf = finding.confidence;
              let confColor = 'bg-gray-100 text-gray-700 border-gray-200';
              if (conf >= 80) confColor = 'bg-red-50 text-red-700 border-red-200';
              else if (conf >= 50) confColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';

              return (
                <tr 
                  key={finding.id} 
                  onClick={() => jumpToSlice(finding.sliceRange)}
                  className={clsx(bgRow, "hover:bg-blue-50/50 cursor-pointer transition-colors group")}
                >
                  <td className="px-4 py-3 text-center font-bold text-muted">{finding.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{finding.sliceRange}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{finding.location}</td>
                  <td className="px-4 py-3">{finding.sizePx} px²</td>
                  <td className="px-4 py-3">
                    <span className={clsx("px-2 py-0.5 rounded border font-bold text-xs inline-flex w-16 justify-center shadow-sm", confColor)}>
                      {conf}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center flex items-center justify-center space-x-1.5">
                    <button onClick={(e) => handleAction(e, finding.id, 'accepted')} className={clsx("p-1.5 rounded outline-none transition-colors", finding.status === 'accepted' ? "bg-green-100 text-green-700 shadow-inner" : "text-gray-400 hover:bg-green-50 hover:text-green-600")} title="Accept Finding">
                       <Check className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleAction(e, finding.id, 'rejected')} className={clsx("p-1.5 rounded outline-none transition-colors", finding.status === 'rejected' ? "bg-red-100 text-red-700 shadow-inner" : "text-gray-400 hover:bg-red-50 hover:text-red-600")} title="Reject Finding">
                       <X className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleAction(e, finding.id, 'flagged')} className={clsx("p-1.5 rounded outline-none transition-colors", finding.status === 'flagged' ? "bg-yellow-100 text-yellow-700 shadow-inner" : "text-gray-400 hover:bg-yellow-50 hover:text-yellow-600")} title="Flag for Review">
                       <Flag className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-2 bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
         <button onClick={() => setFindings(f => f.map(x => ({...x, status: 'accepted'})))} className="px-4 py-1.5 text-xs font-semibold bg-white border border-border text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
            Accept All Findings
         </button>
      </div>
    </div>
  );
}
