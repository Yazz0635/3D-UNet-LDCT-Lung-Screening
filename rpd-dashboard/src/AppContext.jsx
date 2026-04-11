import React, { createContext, useContext, useState } from 'react';

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
  // Preload as 'ready' with mock patient matching requirements
  const [appState, setAppState] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'ready'
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Real inference memory
  const [rawVolume, setRawVolume] = useState(null); // Uint8Array 96x96x96
  const [rawMask, setRawMask] = useState(null); // Uint8Array 96x96x96
  const [rawBoxes, setRawBoxes] = useState([]); // List of 96 arrays

  const [currentSlice, setCurrentSlice] = useState(48);
  const [diagnosticResult, setDiagnosticResult] = useState('tumor'); // 'healthy' | 'tumor' | null
  const [findings, setFindings] = useState(MOCK_FINDINGS);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [syncViews, setSyncViews] = useState(true);
  const [showMask, setShowMask] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(5);
  const [annotations, setAnnotations] = useState('Patient exhibits mild pleural thickening. 3D U-Net segmentation highlights two primary loci of interest requiring further biopsy consideration.');
  const [activeTab, setActiveTab] = useState('findings'); // 'patient' | 'findings' | 'annotations'
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const value = {
    MOCK_PATIENT,
    appState, setAppState,
    uploadedFile, setUploadedFile,
    rawVolume, setRawVolume,
    rawMask, setRawMask,
    rawBoxes, setRawBoxes,
    currentSlice, setCurrentSlice,
    diagnosticResult, setDiagnosticResult,
    findings, setFindings,
    overlayOpacity, setOverlayOpacity,
    brightness, setBrightness,
    contrast, setContrast,
    zoom, setZoom,
    syncViews, setSyncViews,
    showMask, setShowMask,
    confidenceThreshold, setConfidenceThreshold,
    annotations, setAnnotations,
    activeTab, setActiveTab,
    sidebarExpanded, setSidebarExpanded,
    activeModal, setActiveModal
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
