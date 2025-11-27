
import React, { useEffect, useState } from 'react';
import { MergePackage } from '../types';
import { X, Loader2, AlertTriangle, ArrowRightLeft, FileText } from 'lucide-react';
import { fetchChangelog, fetchDebianChangelog } from '../services/api';

interface ComparisonModalProps {
  pkg: MergePackage;
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ pkg, isOpen, onClose }) => {
  const [ubuntuLog, setUbuntuLog] = useState<string | null>(null);
  const [debianLog, setDebianLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Track errors separately
  const [ubuntuError, setUbuntuError] = useState(false);
  const [debianError, setDebianError] = useState(false);

  useEffect(() => {
    if (isOpen && pkg) {
      setLoading(true);
      setUbuntuError(false);
      setDebianError(false);
      setUbuntuLog(null);
      setDebianLog(null);
      
      const p1 = fetchChangelog(pkg)
        .then(setUbuntuLog)
        .catch(() => setUbuntuError(true));
        
      const p2 = fetchDebianChangelog(pkg)
        .then(setDebianLog)
        .catch(() => setDebianError(true));

      Promise.allSettled([p1, p2]).then(() => {
        setLoading(false);
      });
    }
  }, [isOpen, pkg]);

  if (!isOpen) return null;

  const renderPanel = (
    title: string, 
    version: string, 
    log: string | null, 
    isError: boolean, 
    color: string, 
    bgColor: string
  ) => (
    <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-gray-100 last:border-0">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: bgColor }}>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide" style={{ color }}>{title}</h4>
          <span className="text-xs font-mono text-gray-600">{version}</span>
        </div>
        {isError && (
             <span className="text-xs text-red-500 font-medium flex items-center">
               <AlertTriangle size={12} className="mr-1" /> Unavailable
             </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4 bg-white relative">
        {loading ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
              <Loader2 size={24} className="animate-spin mb-2" style={{ color }} />
           </div>
        ) : isError ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
             <FileText size={32} className="text-gray-200 mb-2" />
             <p className="text-xs text-gray-400">Changelog not found</p>
          </div>
        ) : (
          <pre className="font-mono text-xs text-[#333] whitespace-pre-wrap leading-relaxed">
            {log}
          </pre>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-ubuntu" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#262626] bg-opacity-80 transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFA] shrink-0">
          <div className="flex items-center space-x-3">
             <div className="bg-[#262626] p-2 rounded-sm text-white">
                <ArrowRightLeft size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-[#262626] leading-tight">Version Comparison</h3>
                <p className="text-xs text-[#5D5D5D] mt-0.5">{pkg.name}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-[#262626] transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body - Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {renderPanel(
            'Ubuntu', 
            pkg.ubuntuVersion, 
            ubuntuLog, 
            ubuntuError, 
            '#E95420', // Orange
            '#FFF5F0'  // Light Orange bg
          )}
          {renderPanel(
            'Debian', 
            pkg.debianVersion, 
            debianLog, 
            debianError, 
            '#D70A53', // Red
            '#FFF0F5'  // Light Red bg
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAFAFA] border-t border-gray-100 shrink-0 flex justify-end">
           <button 
             onClick={onClose}
             className="text-sm font-medium text-[#5D5D5D] hover:text-[#262626] px-4 py-2"
           >
             Close Comparison
           </button>
        </div>
      </div>
    </div>
  );
};
