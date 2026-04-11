import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../AppContext';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import clsx from 'clsx';

export default function CTViewer() {
  const canvasRef = useRef(null);
  const { currentSlice, brightness, setBrightness, contrast, setContrast, zoom, setZoom, rawVolume } = useAppContext();
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const sliceImageData = useMemo(() => {
    if (!rawVolume) return null;
    const size = 96 * 96;
    const offset = currentSlice * size;
    const slicePixels = rawVolume.slice(offset, offset + size);
    
    // Convert 1-channel to 4-channel RGBA for Canvas ImageData
    const rgba = new Uint8ClampedArray(size * 4);
    for (let i = 0; i < size; i++) {
      const v = slicePixels[i];
      rgba[i*4] = v; // R
      rgba[i*4 + 1] = v; // G
      rgba[i*4 + 2] = v; // B
      rgba[i*4 + 3] = 255; // A
    }
    return new ImageData(rgba, 96, 96);
  }, [currentSlice, rawVolume]);

  useEffect(() => {
    if (!sliceImageData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Create an intermediate 96x96 canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = 96;
    offscreen.height = 96;
    const offCtx = offscreen.getContext('2d');
    
    offCtx.putImageData(sliceImageData, 0, 0);

    // Draw scaled up to main canvas
    ctx.imageSmoothingEnabled = false; // Nearest neighbor upscaling for raw pixels
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // clear background

    ctx.save();
    
    // apply pan & zoom
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Draw the 96x96 slice spanning the whole 512x512 canvas
    ctx.drawImage(offscreen, 0, 0, 96, 96, 0, 0, canvas.width, canvas.height);
    
    ctx.restore();
  }, [sliceImageData, zoom, pan]);

  const handleZoomIn = () => setZoom(z => Math.min(5, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(1, z - 0.25));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="flex-1 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden min-w-[300px]">
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-gray-50 flex-shrink-0">
        <h3 className="font-semibold text-text-primary">Raw Low-Dose CT</h3>
        <div className="bg-white px-2 py-1 rounded-md text-xs font-bold border border-gray-200">Slice {currentSlice}</div>
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
             <span>Brightness</span>
             <span>{brightness}%</span>
          </div>
          <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full accent-primary h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="flex flex-col flex-1 justify-center relative -top-0.5">
          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
             <span>Contrast</span>
             <span>{contrast}%</span>
          </div>
          <input type="range" min="50" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full accent-primary h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
