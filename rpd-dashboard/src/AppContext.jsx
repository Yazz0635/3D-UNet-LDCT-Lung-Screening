import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const MOCK_PATIENT = {
  name: "Rajesh Kumar",
  id: "PT-2024-0047",
  age: 58, gender: "Male",
  scanDate: "2024-03-15",
  physician: "Dr. Priya Nair",
  hospital: "Apollo Hospitals, Chennai",
  scanType: "Low-Dose CT (LDCT)",
  scanner: "Siemens SOMATOM Definition AS+",
  sliceThickness: "1.0 mm"
};

export const MOCK_FINDINGS = [
  { id: 1, sliceRange: "30–45", location: "Left Lobe — Peripheral", sizePx: 47, confidence: 91.3, status: 'pending' },
  { id: 2, sliceRange: "62–71", location: "Right Lobe — Central", sizePx: 23, confidence: 74.8, status: 'pending' },
];

export function AppProvider({ children }) {
  // --- EXISTING UI & MOCK STATE ---
  const [appState, setAppState] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'ready'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [rawVolume, setRawVolume] = useState(null); 
  const [rawMask, setRawMask] = useState(null); 
  const [rawBoxes, setRawBoxes] = useState([]); 
  const [currentSlice, setCurrentSlice] = useState(48);
  const [diagnosticResult, setDiagnosticResult] = useState('tumor'); 
  const [findings, setFindings] = useState(MOCK_FINDINGS);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(2.2);
  const [syncViews, setSyncViews] = useState(true);
  const [showMask, setShowMask] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(5);
  const [annotations, setAnnotations] = useState('Patient exhibits mild pleural thickening. 3D U-Net segmentation highlights two primary loci of interest requiring further biopsy consideration.');
  const [activeTab, setActiveTab] = useState('findings'); 
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // --- NEW AI API STATE ---
  const [sessionId, setSessionId] = useState(null);
  const [sliceData, setSliceData] = useState(null); // Holds the Base64 image & confidence from Python
  const [isUploading, setIsUploading] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  // --- API FUNCTIONS ---
  const handleUpload = async (file) => {
    if (!file) return;
    
    setUploadedFile(file);
    setAppState('uploading');
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Send file to Python server
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setSessionId(data.session_id);
        setCurrentSlice(data.best_slice_idx); 
        setAppState('ready'); // Unlocks the MainStage Viewers
        fetchSlice(data.session_id, data.best_slice_idx);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setAppState('idle');
    }
    setIsUploading(false);
  };

  const fetchSlice = async (session, sliceIdx) => {
    if (!session) return;
    setIsSliding(true);
    try {
      // 2. Fast-fetch the 2D slice from Python's RAM
      const res = await fetch(`http://localhost:8000/slice/${session}/${sliceIdx}`);
      const data = await res.json();
      
      setSliceData(data);
      setDiagnosticResult(data.tumor_detected ? 'tumor' : 'healthy');
    } catch (error) {
      console.error("Failed to fetch slice:", error);
    }
    setIsSliding(false);
  };

  // --- SLIDER LISTENER ---
  // Automatically fetch a new image from Python whenever currentSlice changes
  useEffect(() => {
    if (sessionId && appState === 'ready') {
      fetchSlice(sessionId, currentSlice);
    }
  }, [currentSlice, sessionId, appState]);

  const value = {
    MOCK_PATIENT, appState, setAppState, uploadedFile, setUploadedFile,
    rawVolume, setRawVolume, rawMask, setRawMask, rawBoxes, setRawBoxes,
    currentSlice, setCurrentSlice, diagnosticResult, setDiagnosticResult,
    findings, setFindings, overlayOpacity, setOverlayOpacity,
    brightness, setBrightness, contrast, setContrast, zoom, setZoom,
    syncViews, setSyncViews, showMask, setShowMask, confidenceThreshold, setConfidenceThreshold,
    annotations, setAnnotations, activeTab, setActiveTab,
    sidebarExpanded, setSidebarExpanded, activeModal, setActiveModal,
    
    // Export the new API tools
    sessionId, sliceData, isUploading, isSliding, handleUpload
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}