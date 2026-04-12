import React, { useRef } from 'react';
import { useAppContext } from '../../AppContext';
import { CloudUpload, CircleCheck } from 'lucide-react';
import { useInference } from '../../hooks/useInference';
import clsx from 'clsx';

export default function FileUploader() {
  const { appState, setAppState, setDiagnosticResult, setFindings, setUploadedFile, setRawVolume, setRawMask, setRawBoxes } = useAppContext();
  const fileInputRef = useRef(null);

  const handleInferenceComplete = (result) => {
    // result contains { volume_b64, prob_b64, boundingBoxes }
    // Convert Base64 back to Uint8Array efficiently
    const volStr = atob(result.volume_b64);
    const volBuf = new Uint8Array(volStr.length);
    for(let i=0; i<volStr.length; ++i) volBuf[i] = volStr.charCodeAt(i);
    setRawVolume(volBuf);

    const probStr = atob(result.prob_b64);
    const probBuf = new Uint8Array(probStr.length);
    for(let i=0; i<probStr.length; ++i) probBuf[i] = probStr.charCodeAt(i);
    setRawMask(probBuf);

    setRawBoxes(result.boundingBoxes);

    // Build Finding Table dynamically
    const dynamicFindings = [];
    let currentFinding = null;
    let findingIdCounter = 1;
    
    // Scan Z axis to group contiguous bounding boxes into findings
    for(let z=0; z<96; z++) {
       const boxes = result.boundingBoxes[z];
       if (boxes && boxes.length > 0) {
           if (!currentFinding) {
               currentFinding = {
                   id: findingIdCounter++,
                   zStart: z,
                   zEnd: z,
                   maxConf: boxes[0].confidence,
                   sizePx: boxes[0].width * boxes[0].height,
               };
           } else {
               currentFinding.zEnd = z;
               currentFinding.maxConf = Math.max(currentFinding.maxConf, boxes[0].confidence);
               currentFinding.sizePx = Math.max(currentFinding.sizePx, boxes[0].width * boxes[0].height);
           }
       } else {
           if (currentFinding) {
               currentFinding.sliceRange = currentFinding.zStart === currentFinding.zEnd ? `${currentFinding.zStart}` : `${currentFinding.zStart}–${currentFinding.zEnd}`;
               currentFinding.confidence = currentFinding.maxConf;
               currentFinding.location = "Lobe Region (AI Estimated)";
               currentFinding.status = "pending";
               dynamicFindings.push(currentFinding);
               currentFinding = null;
           }
       }
    }
    if (currentFinding) {
       currentFinding.sliceRange = `${currentFinding.zStart}–${currentFinding.zEnd}`;
       currentFinding.confidence = currentFinding.maxConf;
       currentFinding.location = "Lobe Region (AI Estimated)";
       currentFinding.status = "pending";
       dynamicFindings.push(currentFinding);
    }

    setFindings(dynamicFindings);
    setDiagnosticResult(dynamicFindings.length > 0 ? 'tumor' : 'healthy');
    setAppState('ready');
  };

  const { isProcessing, progress, currentStageIndex, stages, startInference, resetInference } = useInference(handleInferenceComplete);

  const triggerUpload = (file) => {
    if (!file) return;
    setUploadedFile({ name: file.name, size: (file.size / (1024*1024)).toFixed(1) + ' MB' });
    setAppState('uploading');
    startInference(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (appState === 'processing') return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       triggerUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
       triggerUpload(e.target.files[0]);
    }
  };

  if (!isProcessing && appState === 'ready') {
    return (
      <div className="px-2 py-3 bg-blue-900/50 rounded-xl border border-blue-800">
        <div className="flex items-center text-sm text-green-400 font-medium mb-1 px-1">
          <CircleCheck className="w-4 h-4 mr-2" /> Ready
        </div>
        <p className="text-xs text-blue-200 px-1 mb-2 truncate">patient_scan.nii.gz</p>
        <button 
          onClick={() => {
            setAppState('idle');
            setDiagnosticResult(null);
            setFindings([]);
            resetInference();
          }}
          className="w-full py-1.5 mt-1 text-xs font-semibold bg-blue-800 hover:bg-blue-700 text-white rounded-md transition"
        >
          Clear Volume
        </button>
      </div>
    );
  }

  return (
    <div 
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className={clsx(
        "p-4 border-2 border-dashed rounded-xl transition-all",
        isProcessing ? "border-blue-500 bg-blue-900/20" : "border-gray-500 hover:border-blue-400 bg-blue-900/10 hover:bg-blue-900/30 cursor-pointer"
      )}
        onClick={() => {
          if (!isProcessing && appState === 'idle') {
            fileInputRef.current?.click();
          }
        }}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept=".nii,.gz" onChange={handleFileChange} />
        
        {!isProcessing ? (
        <div className="flex flex-col items-center text-center space-y-2">
          <CloudUpload className="w-8 h-8 text-blue-300" />
          <p className="text-xs font-medium text-blue-100">Drag & Drop .nii.gz</p>
          <p className="text-[10px] text-blue-400">or click to browse</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center text-xs text-blue-100">
             <span className="truncate pr-2">{stages[currentStageIndex]?.label || 'Starting...'}</span>
             <span className="font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-blue-950 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-400 h-full transition-all duration-100 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
