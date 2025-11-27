
import React, { useEffect, useState } from 'react';
import { MergePackage } from '../types';
import { X, ExternalLink, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { fetchChangelog, fetchDebianChangelog } from '../services/api';

interface ChangelogModalProps {
  pkg: MergePackage;
  isOpen: boolean;
  variant: 'ubuntu' | 'debian';
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ pkg, isOpen, variant, onClose }) => {
  const [changelog, setChangelog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen && pkg) {
      setLoading(true);
      setError(false);
      setChangelog(null);
      
      const fetcher = variant === 'ubuntu' ? fetchChangelog : fetchDebianChangelog;
      
      fetcher(pkg)
        .then(text => {
          setChangelog(text);
          setLoading(false);
        })
        .catch(err => {
          console.error(`Failed to fetch ${variant} changelog`, err);
          setError(true);
          setLoading(false);
        });
    }
  }, [isOpen, pkg, variant]);

  if (!isOpen) return null;

  const getBranding = () => {
    if (variant === 'ubuntu') {
      return {
        color: '#E95420', // Ubuntu Orange
        title: 'Ubuntu Changes',
        version: pkg.ubuntuVersion,
        sourceLabel: 'changelogs.ubuntu.com',
        externalLink: `https://bugs.launchpad.net/ubuntu/+source/${pkg.name}/${pkg.ubuntuVersion}`,
        externalLabel: 'Open in Launchpad'
      };
    } else {
      return {
        color: '#D70A53', // Debian Red
        title: 'Debian Changes',
        version: pkg.debianVersion,
        sourceLabel: 'tracker.debian.org',
        externalLink: `https://tracker.debian.org/pkg/${pkg.name}`,
        externalLabel: 'Open in Debian Tracker'
      };
    }
  };

  const branding = getBranding();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-ubuntu" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#262626] bg-opacity-80 transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAFA]">
          <div className="flex items-center space-x-3">
             <div className="p-2 rounded-sm text-white" style={{ backgroundColor: branding.color }}>
                <FileText size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-[#262626] leading-tight">{branding.title} for {pkg.name}</h3>
                <p className="text-xs text-[#5D5D5D] mt-0.5 font-mono">{branding.version}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-[#262626] transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 bg-white relative min-h-[300px]">
          {loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: branding.color }}>
                <Loader2 size={32} className="animate-spin mb-3" />
                <span className="text-sm font-medium">Fetching changelog...</span>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertTriangle size={48} className="text-gray-300 mb-4" />
              <h4 className="text-[#262626] font-bold mb-2">Changelog Snippet Unavailable</h4>
              <p className="text-sm text-[#5D5D5D] max-w-md mb-6">
                We couldn't retrieve the raw changelog file for this version directly.
              </p>
              <a 
                href={branding.externalLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm shadow-sm text-white focus:outline-none hover:opacity-90 transition-opacity"
                style={{ backgroundColor: branding.color }}
              >
                {branding.externalLabel} <ExternalLink size={14} className="ml-2" />
              </a>
            </div>
          ) : (
            <pre className="font-mono text-xs sm:text-sm text-[#333] whitespace-pre-wrap leading-relaxed">
              {changelog}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAFAFA] border-t border-gray-100 flex justify-between items-center">
           <span className="text-xs text-[#AEA79F]">
             Source: {branding.sourceLabel}
           </span>
           <a 
             href={branding.externalLink}
             target="_blank"
             rel="noreferrer"
             className="text-sm font-medium hover:underline inline-flex items-center"
             style={{ color: '#0066CC' }}
           >
             {branding.externalLabel} <ExternalLink size={14} className="ml-1.5" />
           </a>
        </div>
      </div>
    </div>
  );
};
