
import React from 'react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MergePackage, PackageSet } from '../types';
import { Package, Users, Clock } from 'lucide-react';

interface DashboardProps {
  data: MergePackage[];
  onTeamClick: (team: string) => void;
}

// Canonical Brand Colors
const COLORS = {
  needsMerge: '#E95420', // Ubuntu Orange
  syncAvailable: '#77216F', // Ubuntu Aubergine
  outdated: '#AEA79F', // Warm Grey
  unknown: '#333333',
  chartBlue: '#0066CC', // Secondary accent
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtext?: string }> = ({ title, value, icon, color, subtext }) => (
  <div className="bg-white p-6 rounded-sm shadow-sm border-t-4 border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow" style={{borderTopColor: color}}>
    <div>
      <p className="text-xs font-bold text-[#5D5D5D] uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-light text-[#262626]">{value}</h3>
      {subtext && <p className="text-xs text-[#AEA79F] mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}10`, color: color }}>
      {icon}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data, onTeamClick }) => {
  const stats = React.useMemo(() => {
    const s: {
      total: number;
      mainCount: number;
      universeCount: number;
      restrictedCount: number;
      multiverseCount: number;
      totalDays: number;
      teams: Record<string, number>;
      ageBins: {
        week1: number;
        month1: number;
        month6: number;
        older: number;
      }
    } = {
      total: data.length,
      mainCount: 0,
      universeCount: 0,
      restrictedCount: 0,
      multiverseCount: 0,
      totalDays: 0,
      teams: {},
      ageBins: {
        week1: 0,
        month1: 0,
        month6: 0,
        older: 0
      }
    };
    
    data.forEach(p => {
      if (p.component === PackageSet.MAIN) s.mainCount++;
      else if (p.component === PackageSet.UNIVERSE) s.universeCount++;
      else if (p.component === PackageSet.RESTRICTED) s.restrictedCount++;
      else if (p.component === PackageSet.MULTIVERSE) s.multiverseCount++;

      // Age Stats
      s.totalDays += p.ageInDays;
      if (p.ageInDays <= 7) s.ageBins.week1++;
      else if (p.ageInDays <= 30) s.ageBins.month1++;
      else if (p.ageInDays <= 180) s.ageBins.month6++;
      else s.ageBins.older++;

      // Count teams
      p.teams.forEach(team => {
        if (!s.teams[team]) s.teams[team] = 0;
        s.teams[team]++;
      });
    });
    return s;
  }, [data]);

  const avgAge = stats.total > 0 ? Math.round(stats.totalDays / stats.total) : 0;
  const activeTeamsCount = Object.keys(stats.teams).length;

  const barData = [
    { name: 'Main', count: stats.mainCount },
    { name: 'Universe', count: stats.universeCount },
    { name: 'Restricted', count: stats.restrictedCount },
    { name: 'Multiverse', count: stats.multiverseCount },
  ];

  const ageChartData = [
    { name: '< 1 Week', count: stats.ageBins.week1 },
    { name: '1-4 Weeks', count: stats.ageBins.month1 },
    { name: '1-6 Months', count: stats.ageBins.month6 },
    { name: '> 6 Months', count: stats.ageBins.older },
  ];

  // Prepare Top Teams Data
  const teamData = Object.entries(stats.teams)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 15); // Top 15 teams since we have more space now

  return (
    <div className="space-y-6 font-ubuntu">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Packages" value={stats.total} icon={<Package size={24} />} color="#333" />
        <StatCard title="Average Age" value={`${avgAge}d`} subtext="Time Pending" icon={<Clock size={24} />} color={COLORS.chartBlue} />
        <StatCard title="Active Teams" value={activeTeamsCount} subtext="Involved in Merges" icon={<Users size={24} />} color={COLORS.syncAvailable} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
          <h3 className="text-xl font-light mb-6 text-[#262626]">Pending Age Distribution</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#5D5D5D'}} />
                <YAxis />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="count" fill="#0066CC" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component Distribution */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
           <h3 className="text-xl font-light mb-6 text-[#262626]">Packages by Component</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                 <XAxis dataKey="name" tick={{fontSize: 12, fill: '#5D5D5D'}} />
                 <YAxis />
                 <Tooltip cursor={{fill: '#f3f4f6'}} />
                 <Bar dataKey="count" fill="#E95420" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Top Teams - Full Width */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
        <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
           <Users className="text-[#77216F] mr-2" size={20} />
           <h3 className="text-xl font-light text-[#262626]">Top Teams by Package Volume</h3>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamData} margin={{ top: 0, right: 0, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                interval={0}
                tick={{fontSize: 11, fill: '#5D5D5D'}}
              />
              <YAxis />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Bar 
                dataKey="count" 
                fill="#77216F" 
                radius={[4, 4, 0, 0]} 
                barSize={40} 
                cursor="pointer"
                onClick={(entry) => onTeamClick(entry.name)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
