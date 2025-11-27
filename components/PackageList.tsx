
import React, { useState, useMemo } from 'react';
import { MergePackage, PackageSet } from '../types';
import { Search, ChevronRight, Clock, Filter, ArrowUpDown, User, Layers } from 'lucide-react';

interface PackageListProps {
  data: MergePackage[];
  onSelectPackage: (pkg: MergePackage) => void;
  initialFilterTeam?: string;
}

const ITEMS_PER_PAGE = 25;

type SortField = 'name' | 'ageInDays' | 'ubuntuVersion' | 'debianVersion' | 'uploader';

export const PackageList: React.FC<PackageListProps> = ({ data, onSelectPackage, initialFilterTeam }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterComponent, setFilterComponent] = useState<PackageSet | 'All'>('All');
  const [filterTeam, setFilterTeam] = useState<string>(initialFilterTeam || 'All');
  const [filterAge, setFilterAge] = useState<string>('All');
  const [filterUploader, setFilterUploader] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('ageInDays');
  const [sortAsc, setSortAsc] = useState(false); // Default descending for Age

  // Helper to extract name from "First Last <email>" format
  const getUploaderName = (fullString: string) => {
    if (!fullString || fullString === 'Unknown') return 'Unknown';
    // Split by '<' to separate name from email, then trim whitespace
    return fullString.split('<')[0].trim();
  };

  // Extract Unique Teams
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    data.forEach(pkg => pkg.teams.forEach(t => teams.add(t)));
    return Array.from(teams).sort();
  }, [data]);

  // Extract Unique Uploaders (Names only)
  const uniqueUploaders = useMemo(() => {
    const uploaders = new Set<string>();
    data.forEach(pkg => {
      if (pkg.uploader && pkg.uploader !== 'Unknown') {
        const name = getUploaderName(pkg.uploader);
        uploaders.add(name);
      }
    });
    return Array.from(uploaders).sort();
  }, [data]);

  // Filter Logic
  const filteredData = data.filter(pkg => {
    const pkgName = pkg.name || ''; 
    const matchesSearch = pkgName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComponent = filterComponent === 'All' || pkg.component === filterComponent;
    const matchesTeam = filterTeam === 'All' || pkg.teams.includes(filterTeam);
    
    // For uploader filter, compare against the extracted name
    const uploaderName = getUploaderName(pkg.uploader);
    const matchesUploader = filterUploader === 'All' || uploaderName === filterUploader;
    
    let matchesAge = true;
    if (filterAge !== 'All') {
       if (filterAge === '< 1 Week') matchesAge = pkg.ageInDays < 7;
       else if (filterAge === '1-4 Weeks') matchesAge = pkg.ageInDays >= 7 && pkg.ageInDays <= 30;
       else if (filterAge === '1-6 Months') matchesAge = pkg.ageInDays > 30 && pkg.ageInDays <= 180;
       else if (filterAge === '> 6 Months') matchesAge = pkg.ageInDays > 180;
    }

    return matchesSearch && matchesComponent && matchesTeam && matchesAge && matchesUploader;
  });

  // Sort Logic
  const sortedData = [...filteredData].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    // Special handling for uploader sorting to sort by Name not full string
    if (sortField === 'uploader') {
      valA = getUploaderName(a.uploader);
      valB = getUploaderName(b.uploader);
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getComponentBadge = (component: PackageSet) => {
    let classes = "";
    switch(component) {
      case PackageSet.MAIN:
        classes = "text-[#E95420] bg-orange-50";
        break;
      case PackageSet.UNIVERSE:
        classes = "text-[#77216F] bg-purple-50";
        break;
      case PackageSet.RESTRICTED:
        classes = "text-yellow-700 bg-yellow-50";
        break;
      case PackageSet.MULTIVERSE:
        classes = "text-blue-700 bg-blue-50";
        break;
      default:
        classes = "text-gray-700 bg-gray-100";
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${classes}`}>
        {component}
      </span>
    );
  };

  const SortHeader = ({ field, label, hideOnMobile }: { field: SortField, label: string, hideOnMobile?: boolean }) => (
     <th 
       scope="col" 
       onClick={() => toggleSort(field)}
       className={`px-6 py-3 text-left text-xs font-bold text-[#5D5D5D] uppercase tracking-wider cursor-pointer hover:bg-gray-100 hover:text-[#262626] transition-colors group ${hideOnMobile ? 'hidden lg:table-cell' : ''}`}
     >
       <div className="flex items-center">
         {label}
         <ArrowUpDown size={12} className={`ml-1 ${sortField === field ? 'text-[#E95420]' : 'text-gray-300 group-hover:text-gray-400'}`} />
       </div>
     </th>
  );

  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-100 flex flex-col h-full font-ubuntu">
      {/* Filters Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#FAFAFA]">
        <div className="flex flex-1 gap-2 flex-col sm:flex-row flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] sm:text-sm transition-colors"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
             {/* Component Filter - Moved here as a dropdown */}
            <div className="relative min-w-[150px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Layers className="h-4 w-4 text-gray-400" />
              </div>
              <select 
                value={filterComponent}
                onChange={(e) => { setFilterComponent(e.target.value as any); setCurrentPage(1); }}
                className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-sm leading-5 bg-white focus:outline-none focus:bg-white focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] sm:text-sm transition-colors appearance-none"
              >
                <option value="All">All Components</option>
                <option value="Main">Main</option>
                <option value="Universe">Universe</option>
                <option value="Restricted">Restricted</option>
                <option value="Multiverse">Multiverse</option>
              </select>
            </div>

            <div className="relative min-w-[160px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select 
                value={filterTeam}
                onChange={(e) => { setFilterTeam(e.target.value); setCurrentPage(1); }}
                className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-sm leading-5 bg-white focus:outline-none focus:bg-white focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] sm:text-sm transition-colors appearance-none"
              >
                <option value="All">All Teams</option>
                {uniqueTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[160px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <select 
                value={filterUploader}
                onChange={(e) => { setFilterUploader(e.target.value); setCurrentPage(1); }}
                className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-sm leading-5 bg-white focus:outline-none focus:bg-white focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] sm:text-sm transition-colors appearance-none"
              >
                <option value="All">All Uploaders</option>
                {uniqueUploaders.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[140px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <select 
                value={filterAge}
                onChange={(e) => { setFilterAge(e.target.value); setCurrentPage(1); }}
                className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-sm leading-5 bg-white focus:outline-none focus:bg-white focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420] sm:text-sm transition-colors appearance-none"
              >
                <option value="All">Any Age</option>
                <option value="< 1 Week">&lt; 1 Week</option>
                <option value="1-4 Weeks">1-4 Weeks</option>
                <option value="1-6 Months">1-6 Months</option>
                <option value="> 6 Months">&gt; 6 Months</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F7F7F7]">
            <tr>
              <SortHeader field="name" label="Package" />
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#5D5D5D] uppercase tracking-wider hidden md:table-cell">Component</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#5D5D5D] uppercase tracking-wider hidden xl:table-cell">Team</th>
              <SortHeader field="ubuntuVersion" label="Ubuntu" hideOnMobile={true} />
              <SortHeader field="debianVersion" label="Debian" hideOnMobile={true} />
              <SortHeader field="ageInDays" label="Age" />
              <SortHeader field="uploader" label="Uploader" hideOnMobile={true} />
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentData.length > 0 ? (
              currentData.map((pkg) => (
                <tr 
                  key={pkg.id} 
                  onClick={() => onSelectPackage(pkg)}
                  className="hover:bg-orange-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${pkg.name.startsWith('Unknown (') ? 'text-red-500 font-mono text-xs' : 'text-[#262626]'}`}>
                      {pkg.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                     {getComponentBadge(pkg.component)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                     {pkg.teams.length > 0 ? (
                       <span className="text-xs text-[#5D5D5D] truncate max-w-[150px] inline-block" title={pkg.teams.join(', ')}>
                         {pkg.teams[0]} {pkg.teams.length > 1 && `+${pkg.teams.length - 1}`}
                       </span>
                     ) : (
                       <span className="text-xs text-gray-300">-</span>
                     )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5D5D5D] font-mono hidden sm:table-cell">
                    {pkg.ubuntuVersion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5D5D5D] font-mono hidden sm:table-cell">
                    {pkg.debianVersion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#262626]">
                    {pkg.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5D5D5D] hidden lg:table-cell">
                     <span className="truncate max-w-[220px] inline-block align-middle" title={pkg.uploader}>
                       {pkg.uploader !== 'Unknown' ? getUploaderName(pkg.uploader) : <span className="text-gray-300">-</span>}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#E95420]" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                  No packages found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-auto bg-[#FAFAFA]">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#5D5D5D]">
                Showing <span className="font-bold text-[#262626]">{startIndex + 1}</span> to <span className="font-bold text-[#262626]">{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)}</span> of <span className="font-bold text-[#262626]">{filteredData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-[#5D5D5D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-sm"
                >
                  Previous
                </button>
                <button
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-[#5D5D5D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-sm"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
          {/* Mobile minimal pagination */}
          <div className="flex items-center justify-between w-full sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
               className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-sm text-[#262626] bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-[#5D5D5D]">Page {currentPage} of {totalPages}</span>
             <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
               className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-sm text-[#262626] bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
