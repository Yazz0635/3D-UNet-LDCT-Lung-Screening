import React from 'react';
import { useAppContext } from '../../AppContext';
import { CloudUpload, Users, Clock, Settings, CircleAlert, Download, FileText } from 'lucide-react';
import clsx from 'clsx';
import FileUploader from '../upload/FileUploader';

export default function Sidebar() {
  const { sidebarExpanded, setSidebarExpanded, setActiveModal } = useAppContext();

  const toggleSidebar = () => setSidebarExpanded(v => !v);

  const navItems = [
    { icon: <CloudUpload />, label: "Upload & Inference", isAction: false, isUploader: true },
    { icon: <Users />, label: "Patient List", isAction: false },
    { icon: <Clock />, label: "Case History", isAction: false },
    { icon: <Settings />, label: "Model Settings", isAction: true, action: () => setActiveModal('settings') },
    { icon: <Download />, label: "Export Report", isAction: true, action: () => setActiveModal('export') },
    { icon: <FileText />, label: "Audit Logs", isAction: false },
  ];

  return (
    <aside 
      className={clsx(
        "bg-primary text-white flex flex-col transition-all duration-250 ease-in-out border-r border-gray-800 z-10 flex-shrink-0 h-full",
        sidebarExpanded ? "w-[280px]" : "w-[56px]"
      )}
      onMouseEnter={() => !sidebarExpanded && setSidebarExpanded(true)}
      onMouseLeave={() => sidebarExpanded && setSidebarExpanded(false)}
    >
      <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden pt-2">
        
        {sidebarExpanded && (
          <div className="px-4 mb-4">
             <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">Actions</div>
          </div>
        )}

        <ul className="space-y-1 px-2">
          {navItems.map((item, i) => (
            <li key={i}>
              {item.isUploader && sidebarExpanded ? (
                <div className="mb-4 mt-2"><FileUploader /></div>
              ) : (
                <button
                  onClick={item.isAction ? item.action : undefined}
                  title={!sidebarExpanded ? item.label : undefined}
                  className="w-full flex items-center p-2 rounded-lg hover:bg-blue-800 transition-colors group relative"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex justify-center items-center">
                    {React.cloneElement(item.icon, { className: "w-5 h-5 text-gray-300 group-hover:text-white" })}
                  </span>
                  
                  <span className={clsx("ml-4 text-sm font-medium whitespace-nowrap transition-opacity", sidebarExpanded ? "opacity-100" : "opacity-0 invisible")}>
                    {item.label}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-2 border-t border-blue-900 mt-auto">
        <button 
          title="System Warnings"
          className="w-full flex items-center p-2 rounded-lg hover:bg-red-900/30 text-red-200 transition-colors group"
        >
          <span className="flex-shrink-0 w-6 h-6 flex justify-center items-center">
             <CircleAlert className="w-5 h-5" />
          </span>
          <span className={clsx("ml-4 text-sm font-medium whitespace-nowrap transition-opacity", sidebarExpanded ? "opacity-100" : "opacity-0 w-0")}>
            2 System Alerts
          </span>
        </button>
      </div>

    </aside>
  );
}
