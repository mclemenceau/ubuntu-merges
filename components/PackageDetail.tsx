
import React, { useState, useEffect } from 'react';
import { MergePackage, PackageSet } from '../types';
import { X, ExternalLink, Users, User, FileText, ArrowRightLeft } from 'lucide-react';
import { ChangelogModal } from './ChangelogModal';
import { ComparisonModal } from './ComparisonModal';

interface PackageDetailProps {
  pkg: MergePackage | null;
  onClose: () => void;
}

export const PackageDetail: React.FC<PackageDetailProps> = ({ pkg, onClose }) => {
  const [changelogVariant, setChangelogVariant] = useState<'ubuntu' | 'debian' | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    setChangelogVariant(null);
    setIsCompareOpen(false);
  }, [pkg]);

  if (!pkg) return null;

  const getComponentBadgeClass = (component: PackageSet) => {
    switch(component) {
      case PackageSet.MAIN:
        return 'bg-[#E95420] text-white';
      case PackageSet.UNIVERSE:
        return 'bg-[#77216F] text-white';
      case PackageSet.RESTRICTED:
        return 'bg-yellow-600 text-white';
      case PackageSet.MULTIVERSE:
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  // Logic to determine prefix for merges.ubuntu.com URL (standard repo layout)
  const getMergeReportUrl = () => {
    const prefix = pkg.name.startsWith('lib') ? pkg.name.substring(0, 4) : pkg.name.substring(0, 1);
    return `https://merges.ubuntu.com/${prefix}/${pkg.name}/REPORT`;
  };

  // Parse Uploader
  const parseUploader = (raw: string) => {
    if (!raw || raw === 'Unknown') return { name: 'Unknown', email: null };
    const parts = raw.split('<');
    const name = parts[0].trim();
    const email = parts[1] ? parts[1].replace('>', '').trim() : null;
    return { name, email };
  };

  const { name: uploaderName, email: uploaderEmail } = parseUploader(pkg.uploader);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end font-ubuntu" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
        {/* Background backdrop */}
        <div 
          className="fixed inset-0 bg-[#262626] bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>

        <div className="relative pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 bg-white shadow-xl h-full flex flex-col">
          
          {/* Header - Canonical Dark Grey */}
          <div className="px-6 py-6 bg-[#262626] text-white flex justify-between items-start shadow-md">
            <div>
              <h2 className="text-xl font-light" id="slide-over-title">
                {pkg.name}
              </h2>
              <div className="flex gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wide ${getComponentBadgeClass(pkg.component)}`}>
                  {pkg.component}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className="rounded-md text-[#AEA79F] hover:text-white focus:outline-none transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Close panel</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="relative flex-1 px-6 py-8 overflow-y-auto bg-[#F7F7F7]">
            
            {/* Version Comparison Grid */}
            <div className="relative grid grid-cols-2 gap-4 mb-4">
              {/* Clickable Ubuntu Version Box */}
              <div 
                className="bg-white p-5 rounded-sm shadow-sm border border-gray-100 relative group cursor-pointer hover:border-[#E95420] transition-colors"
                onClick={() => setChangelogVariant('ubuntu')}
                title="Click to view Ubuntu changelog"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <FileText size={16} className="text-[#E95420]" />
                </div>
                <span className="block text-xs text-[#5D5D5D] uppercase tracking-wider font-bold group-hover:text-[#E95420] transition-colors">Ubuntu Version</span>
                <span className="block text-sm font-mono font-bold text-[#262626] break-words mt-2">{pkg.ubuntuVersion}</span>
              </div>
              
              {/* Compare Button - Absolute Centered relative to the version grid only */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="bg-white border border-gray-200 shadow-md rounded-full p-2 text-[#5D5D5D] hover:text-[#0066CC] hover:border-[#0066CC] hover:bg-blue-50 transition-all duration-200 focus:outline-none"
                  title="Compare Versions Side-by-Side"
                >
                  <ArrowRightLeft size={16} />
                </button>
              </div>

              {/* Clickable Debian Version Box */}
              <div 
                className="bg-white p-5 rounded-sm shadow-sm border border-gray-100 relative group cursor-pointer hover:border-[#D70A53] transition-colors"
                onClick={() => setChangelogVariant('debian')}
                title="Click to view Debian changelog"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <FileText size={16} className="text-[#D70A53]" />
                </div>
                <span className="block text-xs text-[#5D5D5D] uppercase tracking-wider font-bold group-hover:text-[#D70A53] transition-colors">Debian Version</span>
                <span className="block text-sm font-mono font-bold text-[#262626] break-words mt-2">{pkg.debianVersion}</span>
              </div>
            </div>

            {/* Last Uploader Section */}
            <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-100 flex items-start mb-8">
              <div className="bg-gray-100 p-2 rounded-full mr-4 mt-1">
                 <User className="w-5 h-5 text-[#5D5D5D]" />
              </div>
              <div>
                <span className="block text-xs text-[#5D5D5D] uppercase tracking-wider font-bold">Last Uploader</span>
                <span className="block text-sm font-medium text-[#262626] mt-1">
                  {uploaderName !== 'Unknown' ? uploaderName : <span className="italic text-gray-400">Not specified</span>}
                </span>
                {uploaderEmail && (
                   <a 
                     href={`mailto:${uploaderEmail}`} 
                     className="block text-xs text-[#0066CC] hover:underline mt-0.5 font-mono"
                   >
                     {uploaderEmail}
                   </a>
                )}
              </div>
            </div>

            {/* Teams Section */}
            {pkg.teams && pkg.teams.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[#262626] mb-3 flex items-center uppercase tracking-wide">
                  <Users className="w-4 h-4 mr-2 text-[#E95420]" />
                  Teams
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pkg.teams.map((team, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-[#5D5D5D] border border-gray-200 shadow-sm">
                      {team}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links Section */}
            <div className="mb-8 p-4 bg-white rounded-sm border border-gray-100">
              <h3 className="text-sm font-bold text-[#262626] mb-3 uppercase tracking-wide">External Resources</h3>
              <div className="flex flex-col space-y-3">
                <a 
                  href={`https://launchpad.net/ubuntu/+source/${pkg.name}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center text-sm text-[#0066CC] hover:underline decoration-1"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View on Launchpad
                </a>
                <a 
                  href={`https://tracker.debian.org/pkg/${pkg.name}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center text-sm text-[#0066CC] hover:underline decoration-1"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Debian Package Tracker
                </a>
                <a 
                  href={getMergeReportUrl()}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center text-sm text-[#0066CC] hover:underline decoration-1"
                >
                  <FileText size={16} className="mr-2" />
                  Merge Report
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Changelog Modal */}
      <ChangelogModal 
        pkg={pkg} 
        isOpen={!!changelogVariant} 
        variant={changelogVariant || 'ubuntu'}
        onClose={() => setChangelogVariant(null)} 
      />

      {/* Comparison Modal */}
      <ComparisonModal
        pkg={pkg}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
    </>
  );
};
