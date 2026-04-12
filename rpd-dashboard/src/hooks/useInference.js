import { useState, useCallback } from 'react';
import { useAppContext } from '../AppContext';

export function useInference(onComplete) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const stages = [
    { label: "Uploading .nii.gz to Server...", weight: 20 },
    { label: "Processing 3D Medical Volume...", weight: 40 },
    { label: "Running 3D U-Net PyTorch Model...", weight: 30 },
    { label: "Constructing Canvas Overlays...", weight: 10 }
  ];

  const startInference = useCallback(async (file) => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStageIndex(0);

    try {
      if (!file) throw new Error("No file provided");
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Stage 0: Upload
      setProgress(10);
      setCurrentStageIndex(0);

      // We use XMLHttpRequest instead of fetch to get upload progress 
      // but to keep it simple with Promises, we'll just mock the visual progress
      // and let fetch run in the background.
      
      const timer = setInterval(() => {
         setProgress(p => Math.min(85, p + 5));
         if (progress > 30) setCurrentStageIndex(1);
         if (progress > 60) setCurrentStageIndex(2);
      }, 500);

      const response = await fetch("http://localhost:8000/api/infer", {
        method: "POST",
        body: formData,
      });

      clearInterval(timer);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setCurrentStageIndex(3);
      setProgress(90);

      const result = await response.json();
      setProgress(100);
      
      setTimeout(() => {
        setIsProcessing(false);
        if (onComplete) onComplete(result);
      }, 500);

    } catch (error) {
      console.error("Inference Error:", error);
      alert("Failed to connect to PyTorch backend. Is it running on port 8000?");
      setIsProcessing(false);
      setProgress(0);
    }
    
  }, [onComplete]);

  const resetInference = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setCurrentStageIndex(0);
  }, []);

  return {
    isProcessing,
    progress,
    currentStageIndex,
    stages,
    startInference,
    resetInference
  };
}
