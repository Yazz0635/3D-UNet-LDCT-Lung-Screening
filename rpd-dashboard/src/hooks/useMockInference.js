import { useState, useCallback } from 'react';

export function useMockInference(onComplete) {
  const [stages] = useState([
    { id: 'validating', label: 'Validating file format...', percentage: 15, duration: 500 },
    { id: 'decompressing', label: 'Decompressing NIfTI volume...', percentage: 40, duration: 1200 },
    { id: 'inference', label: 'Running 3D U-Net inference...', percentage: 85, duration: 2500 },
    { id: 'overlay', label: 'Generating segmentation overlay...', percentage: 100, duration: 800 }
  ]);
  
  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const startInference = useCallback(() => {
    setIsProcessing(true);
    setCurrentStage(0);
    setProgress(0);

    let stageIdx = 0;

    const runStage = () => {
      if (stageIdx >= stages.length) {
        setIsProcessing(false);
        if (onComplete) onComplete();
        return;
      }
      
      const stage = stages[stageIdx];
      setCurrentStage(stageIdx);
      
      const startTime = Date.now();
      const startPercent = stageIdx === 0 ? 0 : stages[stageIdx - 1].percentage;
      const targetPercent = stage.percentage;
      
      const animFrame = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= stage.duration) {
          clearInterval(animFrame);
          setProgress(targetPercent);
          stageIdx++;
          runStage();
        } else {
          const currentT = elapsed / stage.duration;
          setProgress(startPercent + (targetPercent - startPercent) * currentT);
        }
      }, 50);
    };

    runStage();
  }, [stages, onComplete]);

  return {
    isProcessing,
    progress,
    currentStageIndex: isProcessing ? currentStage : stages.length - 1,
    stages,
    startInference,
    resetInference: () => {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStage(0);
    }
  };
}
