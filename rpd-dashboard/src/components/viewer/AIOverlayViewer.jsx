import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../AppContext';
import { ZoomIn, ZoomOut, Maximize, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function AIOverlayViewer() {
  const canvasRef = useRef(null);
  const { currentSlice, brightness, contrast, zoom, setZoom, confidenceThreshold, overlayOpacity, setOverlayOpacity, showMask, setShowMask, rawVolume, rawMask, rawBoxes } = useAppContext();
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const { baseImageData, maskImageData, currentBoxes } = useMemo(() => {
    if (!rawVolume || !rawMask) return { baseImageData: null, maskImageData: null, currentBoxes: [] };
    
    const size = 96 * 96;
    const offset = currentSlice * size;
    const sliceBasePxl = rawVolume.slice(offset, offset + size);
    const sliceMaskPxl = rawMask.slice(offset, offset + size);
    
    const baseRgba = new Uint8ClampedArray(size * 4);
    const maskRgba = new Uint8ClampedArray(size * 4);
    
    for (let i = 0; i < size; i++) {
      // Base CT grayscale
      const v = sliceBasePxl[i];
      baseRgba[i*4] = v; baseRgba[i*4+1] = v; baseRgba[i*4+2] = v; baseRgba[i*4+3] = 255;
      
      // Mask logic
      const conf = sliceMaskPxl[i];
      if (conf >= confidenceThreshold) {
         maskRgba[i*4] = 255;   // R
         maskRgba[i*4+1] = 0;   // G
         maskRgba[i*4+2] = 0;   // B
         maskRgba[i*4+3] = 255; // A (Opacity handled globally)
      } else {
         maskRgba[i*4+3] = 0;
      }
    }
    
    return {
      baseImageData: new ImageData(baseRgba, 96, 96),
      maskImageData: new ImageData(maskRgba, 96, 96),
      currentBoxes: rawBoxes?.[currentSlice] || []
    };
  }, [currentSlice, confidenceThreshold, rawVolume, rawMask, rawBoxes]);

  useEffect(() => {
    if (!baseImageData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 1. Draw base scan
    const offscreenBase = document.createElement('canvas');
    offscreenBase.width = 96; offscreenBase.height = 96;
    const offCtxBase = offscreenBase.getContext('2d');
    offCtxBase.putImageData(baseImageData, 0, 0);

    // 2. Draw mask
    const offscreenMask = document.createElement('canvas');
    offscreenMask.width = 96; offscreenMask.height = 96;
    const offCtxMask = offscreenMask.getContext('2d');
    offCtxMask.putImageData(maskImageData, 0, 0);

    ctx.imageSmoothingEnabled = false; 
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    ctx.save();
    
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Draw Base CT (applying brightness and contrast as global filter is tricky across browsers securely, 
    // but we can apply it to the main canvas CSS, which affects EVERYTHING including drawing. Wait! CSS filter affects all. 
    // We want the AI overlay drawing to NOT be brightness/contrast skewed if possible, but DOM filter is applied to the whole element. 
    // That's acceptable for this simulation.
    
    ctx.drawImage(offscreenBase, 0, 0, 96, 96, 0, 0, canvas.width, canvas.height);
    
    if (showMask) {
      ctx.save();
      ctx.globalAlpha = overlayOpacity;
      ctx.drawImage(offscreenMask, 0, 0, 96, 96, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Ratio to convert from 96x96 to 512x512
      const scaleCanvas = canvas.width / 96;
      
      // Draw Bounding Boxes
      currentBoxes.forEach(box => {
        if (box.confidence < confidenceThreshold) return; // Skip if below threshold
        
        const drawX = box.x * scaleCanvas;
        const drawY = box.y * scaleCanvas;
        const drawW = box.width * scaleCanvas;
        const drawH = box.height * scaleCanvas;
        
        ctx.strokeStyle = '#F59E0B'; // yellow
        ctx.lineWidth = 2 / zoom; // keep border crisp even when zoomed
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        // Confidence badge
        ctx.fillStyle = '#F59E0B';
        const labelText = `Tumor ${box.confidence}%`;
        const textWidth = ctx.measureText(labelText).width;
        const padX = 6 / zoom;
        const padY = 4 / zoom;
        
        // Background for badge
        ctx.fillRect(drawX, drawY - (18 / zoom), textWidth + (padX * 2), (18 / zoom));
        
        // Text
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${10 / zoom}px Inter, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(labelText, drawX + padX, drawY - (18 / zoom) + padY);
      });
    }
    
    ctx.restore();
  }, [baseImageData, maskImageData, currentBoxes, zoom, pan, showMask, overlayOpacity, confidenceThreshold]);

  const handleZoomIn = () => setZoom(z => Math.min(5, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(1, z - 0.25));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="flex-1 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden min-w-[300px]">
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-text-primary">AI Segmentation Overlay</h3>
          {currentBoxes.filter(b => b.confidence >= confidenceThreshold).length > 0 && showMask && (
            <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider inline-flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse" />
              Findings ({currentBoxes.filter(b => b.confidence >= confidenceThreshold).length})
            </span>
          )}
        </div>
      </div>
      
      <div className={clsx("flex-1 relative bg-black flex items-center justify-center overflow-hidden", isDragging ? "cursor-grabbing" : "cursor-grab")}
           onMouseDown={() => setIsDragging(true)}
           onMouseUp={() => setIsDragging(false)}
           onMouseLeave={() => setIsDragging(false)}
           onMouseMove={(e) => {
             if (isDragging) {
               setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
             }
           }}
      >
        <canvas 
          ref={canvasRef} 
          width={512} height={512} 
          className="max-w-full max-h-full object-contain"
          style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
        />
        
        {/* Bottom floating toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-200 p-1 flex items-center space-x-1 cursor-default">
          <button onClick={() => setShowMask(!showMask)} className={clsx("p-1.5 rounded transition-colors mr-1", showMask ? "bg-red-50 text-red-600" : "hover:bg-gray-200 text-gray-500")} title="Toggle AI Mask">
             {showMask ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={handleReset} className="p-1 hover:bg-gray-200 rounded text-gray-700 text-[11px] font-bold w-12 text-center" title="Reset View">{(zoom * 100).toFixed(0)}%</button>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Fullscreen"><Maximize className="w-4 h-4" /></button>
        </div>
      </div>
      
      {/* Footer controls */}
      <div className="h-12 border-t border-border flex items-center px-4 space-x-6 text-sm bg-gray-50 flex-shrink-0 cursor-default">
        <div className="flex flex-col flex-1 justify-center relative -top-0.5">
          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
             <span>Overlay Opacity</span>
             <span>{Math.round(overlayOpacity * 100)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={overlayOpacity} onChange={e => setOverlayOpacity(Number(e.target.value))} className="w-full accent-tumor h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
