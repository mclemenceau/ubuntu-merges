
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, List, Activity, Loader2, RefreshCw, AlertTriangle, Menu } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PackageList } from './components/PackageList';
import { PackageDetail } from './components/PackageDetail';
import { fetchMergeData } from './services/api';
import { MergePackage } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [data, setData] = useState<MergePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<MergePackage | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [preselectedTeam, setPreselectedTeam] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const packages = await fetchMergeData();
      setData(packages);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to Ubuntu merge data sources. Please check your internet connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTeamClick = (team: string) => {
    setPreselectedTeam(team);
    setActiveTab('list');
  };

  const TabButton = ({ id, label, icon }: { id: 'dashboard' | 'list', label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => {
        if (id === 'list') {
          // Reset preselection when manually clicking the tab for a fresh view
          setPreselectedTeam(undefined);
        }
        setActiveTab(id);
      }}
      className={`w-full flex items-center py-3 text-sm font-medium transition-colors duration-150 border-l-4 ${
        activeTab === id 
        ? 'bg-[#333333] border-[#E95420] text-white' 
        : 'border-transparent text-[#AEA79F] hover:text-white hover:bg-[#333333]'
      } ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'}`}
      title={isSidebarCollapsed ? label : ''}
    >
      <span className={`${isSidebarCollapsed ? '' : 'mr-3'}`}>{icon}</span>
      {!isSidebarCollapsed && label}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F7F7F7] overflow-hidden font-ubuntu">
      {/* Sidebar - Collapsible with Canonical Dark Grey */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#262626] flex-col hidden md:flex shadow-xl z-20 transition-[width] duration-300 ease-in-out`}
      >
        {/* Header Area */}
        <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'} mb-4 transition-all duration-300`}>
           {/* Branding (Hidden if collapsed) */}
           {!isSidebarCollapsed && (
             <div className="flex items-center overflow-hidden whitespace-nowrap">
               <div className="bg-[#E95420] p-2 rounded-sm mr-3 shadow-md shrink-0">
                 <Activity className="text-white h-6 w-6" />
               </div>
               <div>
                 <span className="text-white font-bold text-xl tracking-tight block leading-none">Ubuntu</span>
                 <span className="text-[#AEA79F] text-xs font-light tracking-widest uppercase block mt-1">Merges Tracker</span>
               </div>
             </div>
           )}

           {/* Toggle Button */}
           <button 
             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             className={`text-[#AEA79F] hover:text-white transition-colors p-1 rounded-sm ${isSidebarCollapsed ? '' : ''}`}
           >
             <Menu size={24} />
           </button>
        </div>
        
        {/* If collapsed, show a small brand icon below header to maintain identity */}
        {isSidebarCollapsed && (
          <div className="flex justify-center mb-6">
             <div className="bg-[#E95420] p-2 rounded-sm shadow-md">
                 <Activity className="text-white h-5 w-5" />
             </div>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          <TabButton id="dashboard" label="Overview" icon={<LayoutDashboard size={20} />} />
          <TabButton id="list" label="Package List" icon={<List size={20} />} />
        </nav>

        {/* Footer Info */}
        <div className={`p-6 border-t border-[#333333] overflow-hidden whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
          <p className="text-xs text-[#AEA79F] leading-relaxed">
            Data sourced from<br/>
            <span className="text-white font-medium">merges.ubuntu.com</span>
          </p>
          <p className="text-[10px] text-[#5D5D5D] mt-2 uppercase tracking-wide">
            Last Sync: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header (unchanged) */}
        <div className="md:hidden bg-[#262626] text-white p-4 flex items-center justify-between shadow-md">
           <div className="flex items-center">
             <div className="bg-[#E95420] p-1.5 rounded-sm mr-3">
               <Activity className="text-white h-5 w-5" />
             </div>
             <span className="font-bold">Merges Tracker</span>
           </div>
           <div className="flex space-x-1 bg-[#333333] rounded p-1">
             <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded ${activeTab === 'dashboard' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#AEA79F]'}`}>
               <LayoutDashboard size={20} />
             </button>
             <button onClick={() => setActiveTab('list')} className={`p-2 rounded ${activeTab === 'list' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#AEA79F]'}`}>
               <List size={20} />
             </button>
           </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 h-full">
                <Loader2 className="h-10 w-10 text-[#E95420] animate-spin mb-4" />
                <p className="text-[#5D5D5D]">Fetching merge data from Ubuntu...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center flex-1 h-full max-w-lg mx-auto text-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-[#262626] mb-2">Connection Error</h3>
                <p className="text-[#5D5D5D] mb-6">{error}</p>
                {/* Canonical Green Button */}
                <button 
                  onClick={loadData}
                  className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-sm shadow-sm text-white bg-[#0E8420] hover:bg-[#0A6319] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E8420] transition-colors"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </button>
              </div>
            ) : (
              <>
                {/* Header Section */}
                <div className="mb-8 border-b border-gray-200 pb-4">
                  <h1 className="text-3xl font-light text-[#262626]">
                    {activeTab === 'dashboard' ? 'Dashboard Overview' : 'Package Registry'}
                  </h1>
                  <p className="text-[#5D5D5D] mt-2 font-light">
                    Tracking <span className="font-medium text-[#262626]">{data.length}</span> packages across Main and Universe components.
                  </p>
                </div>

                {/* View Content */}
                <div className="flex-1">
                  {activeTab === 'dashboard' ? (
                    <Dashboard 
                      data={data} 
                      onTeamClick={handleTeamClick}
                    />
                  ) : (
                    <PackageList 
                      data={data} 
                      onSelectPackage={setSelectedPackage}
                      initialFilterTeam={preselectedTeam}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Detail Slide-over */}
      <PackageDetail 
        pkg={selectedPackage} 
        onClose={() => setSelectedPackage(null)} 
      />
    </div>
  );
};

export default App;
