import React from 'react';
import { useAppContext } from '../../AppContext';

export default function PatientInfoPanel() {
  const { MOCK_PATIENT } = useAppContext();

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 text-sm text-text-primary bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-8">
        
        <div>
          <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Patient Name</span>
          <span className="font-bold text-base">{MOCK_PATIENT.name}</span>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Patient ID</span>
          <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">{MOCK_PATIENT.id}</span>
        </div>

        <div>
           <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Demographics</span>
           <span className="font-medium text-gray-800">{MOCK_PATIENT.gender}, {MOCK_PATIENT.age} yrs</span>
        </div>

        <div>
           <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Scan Date</span>
           <span className="font-medium text-gray-800">{MOCK_PATIENT.scanDate}</span>
        </div>

        <div>
           <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Referring Physician</span>
           <span className="font-medium text-gray-800">{MOCK_PATIENT.physician}</span>
        </div>

        <div>
           <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Hospital / Clinic</span>
           <span className="font-medium text-gray-800">{MOCK_PATIENT.hospital}</span>
        </div>

        <div>
           <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Scan Protocol</span>
           <span className="font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded shadow-sm">{MOCK_PATIENT.scanType}</span>
        </div>

        <div className="lg:col-span-2">
           <span className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider">Equipment</span>
           <span className="font-medium text-gray-800">{MOCK_PATIENT.scanner} ({MOCK_PATIENT.sliceThickness} slice thickness)</span>
        </div>

      </div>
    </div>
  );
}
