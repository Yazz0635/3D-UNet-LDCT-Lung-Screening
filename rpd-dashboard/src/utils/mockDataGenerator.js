// A simple deterministic pseudo-random number generator
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// 2D simplex noise substitute: simple overlapping sine waves for texture
function noise(x, y, z) {
  return (
    Math.sin(x * 0.1 + z * 0.05) * Math.cos(y * 0.1 + z * 0.05) +
    Math.sin(x * 0.05 - y * 0.05 + z * 0.1)
  ) / 2; // Range roughly -1 to 1
}

// Predefined tumor zones
export const TUMOR_ZONES = [
  { id: 1, zStart: 30, zEnd: 45, cx: 25, cy: 45, radius: 6, maxConfidence: 91.3 },
  { id: 2, zStart: 62, zEnd: 71, cx: 70, cy: 55, radius: 4, maxConfidence: 74.8 }
];

export function generateMockSliceData(sliceIndex, threshold = 5) {
  const width = 96;
  const height = 96;
  
  // We'll create a 1D flat array for pixel intensities (0-255) to be easily converted to ImageData
  const pixels = new Uint8ClampedArray(width * height * 4);
  const mask = new Uint8ClampedArray(width * height * 4);
  const boundingBoxes = []; // To store bounds

  // Base lung shape variables (shifting slightly based on Z)
  const leftLungCx = 30 + Math.sin(sliceIndex * 0.1) * 2;
  const rightLungCx = 66 + Math.cos(sliceIndex * 0.1) * 2;
  const lungCy = 48 + Math.sin(sliceIndex * 0.05) * 3;
  const lungRx = 18;
  const lungRy = 28;

  // Find active tumors for this slice
  const activeTumors = TUMOR_ZONES.filter(t => sliceIndex >= t.zStart && sliceIndex <= t.zEnd);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Add general grain/noise
      const n = noise(x, y, sliceIndex);
      const grain = (n + 1) * 0.5; // 0 to 1
      
      // Distance to left and right lungs
      const distLeft = Math.pow((x - leftLungCx) / lungRx, 2) + Math.pow((y - lungCy) / lungRy, 2);
      const distRight = Math.pow((x - rightLungCx) / lungRx, 2) + Math.pow((y - lungCy) / lungRy, 2);
      
      let intensity = 40; // chest wall baseline (dark gray)
      
      // Inside lungs
      if (distLeft < 1 || distRight < 1) {
        intensity = 100 + grain * 40; // Medium gray with texture
      } 
      
      // Chest wall boundary (white ribs)
      const boundaryDist = Math.min(distLeft, distRight);
      if (boundaryDist > 1.1 && boundaryDist < 1.3) {
        // Occasional bright spots for ribs
        if (seededRandom(x * 100 + y + sliceIndex) > 0.95) {
          intensity = 220 + grain * 30; // Bright white
        }
      }

      // Default mask is empty (transparent black for canvas overlay)
      mask[idx] = 239; // R
      mask[idx + 1] = 68; // G
      mask[idx + 2] = 68; // B
      mask[idx + 3] = 0;  // Alpha (transparent)

      // Add tumor blobs if active
      for (const tumor of activeTumors) {
        // Tumor is mostly in the center of its zone, fading out at z bounds
        const zWeight = 1 - Math.abs(sliceIndex - (tumor.zStart + tumor.zEnd) / 2) / ((tumor.zEnd - tumor.zStart) / 2);
        
        // Confidence drops off towards edges
        const conf = Math.max(10, tumor.maxConfidence * zWeight - (seededRandom(sliceIndex + x + y) * 5));
        
        const r = tumor.radius * zWeight;
        
        // Add some irregularity to the tumor shape using our noise
        const irregularDist = Math.sqrt(Math.pow(x - tumor.cx, 2) + Math.pow(y - tumor.cy, 2)) + n * 2;
        
        if (irregularDist < r) {
          intensity = 180 + grain * 50; // Tumors appear brighter, dense
          if (conf >= threshold) {
            mask[idx + 3] = 153; // 60% opacity (153/255) red mask
          }
        }
      }

      pixels[idx] = intensity;     // R
      pixels[idx + 1] = intensity; // G
      pixels[idx + 2] = intensity; // B
      pixels[idx + 3] = 255;       // A
    }
  }

  // Calculate strict bounding boxes based on the generated mask
  for (const tumor of activeTumors) {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;
    let maxFoundConf = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = mask[(y * width + x) * 4 + 3];
        // Only check this tumor's general area to isolate it
        const inArea = Math.abs(x - tumor.cx) < 15 && Math.abs(y - tumor.cy) < 15;
        if (alpha > 0 && inArea) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
          
          const zWeight = 1 - Math.abs(sliceIndex - (tumor.zStart + tumor.zEnd) / 2) / ((tumor.zEnd - tumor.zStart) / 2);
          const conf = Math.max(10, tumor.maxConfidence * zWeight - (seededRandom(sliceIndex + x + y) * 5));
          if (conf > maxFoundConf) maxFoundConf = conf;
        }
      }
    }
    
    if (found && maxFoundConf >= threshold) {
      boundingBoxes.push({
        id: tumor.id,
        x: Math.max(0, minX - 3),
        y: Math.max(0, minY - 3),
        width: Math.min(width - minX, maxX - minX + 6),
        height: Math.min(height - minY, maxY - minY + 6),
        confidence: maxFoundConf.toFixed(1)
      });
    }
  }

  return { pixels, mask, boundingBoxes };
}
