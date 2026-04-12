import { useEffect } from 'react';
import { useAppContext } from '../AppContext';

export function useKeyboardShortcuts() {
  const { 
    currentSlice, setCurrentSlice, 
    overlayOpacity, setOverlayOpacity, 
    brightness, setBrightness, 
    showMask, setShowMask, 
    syncViews, setSyncViews,
    setActiveModal, activeModal 
  } = useAppContext();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch(e.key) {
        case 'ArrowLeft':
          setCurrentSlice(s => Math.max(0, s - (e.shiftKey ? 5 : 1)));
          break;
        case 'ArrowRight':
          setCurrentSlice(s => Math.min(95, s + (e.shiftKey ? 5 : 1)));
          break;
        case '[':
          setOverlayOpacity(o => Math.max(0, o - 0.1));
          break;
        case ']':
          setOverlayOpacity(o => Math.min(1, o + 0.1));
          break;
        case 'b':
        case 'B':
          setBrightness(b => b === 100 ? 120 : (b === 120 ? 80 : 100)); // Toggle
          break;
        case 'm':
        case 'M':
          setShowMask(m => !m);
          break;
        case 's':
        case 'S':
          setSyncViews(s => !s);
          break;
        case 'e':
        case 'E':
          setActiveModal('export');
          break;
        case '?':
          setActiveModal('help');
          break;
        case 'Escape':
          setActiveModal(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentSlice, setOverlayOpacity, setBrightness, setShowMask, setSyncViews, setActiveModal]);

  return null;
}
