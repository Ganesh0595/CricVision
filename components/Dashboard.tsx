
import React, { useState, useMemo } from 'react';
import { Player, Match, SortConfig, Gender, PlayerRole } from '../types';
import { SearchIcon, UsersIcon, CricketBallIcon, TrophyIcon, TrendingUpIcon, BatIcon, BowlingIcon, AllRounderIcon, EditIcon } from './Icons';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MATCH_FEE_PER_PLAYER } from '../constants';

interface DashboardProps {
  players: Player[];
  matches: Match[];
  onPlayerSelect: (player: Player) => void;
  onEditPlayer: (player: Player) => void;
}

const PlayerRoleIcon: React.FC<{ role: PlayerRole }> = ({ role }) => {
    const iconProps = { className: "h-5 w-5 text-slate-500 dark:text-slate-400" };
    switch (role) {
        case PlayerRole.Batter:
            return <BatIcon {...iconProps} />;
        case PlayerRole.Bowler:
            return <BowlingIcon {...iconProps} />;
        case PlayerRole.AllRounder:
            return <AllRounderIcon {...iconProps} />;
        default:
            return null;
    }
};

const useSortableData = (items: Player[], config: SortConfig = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof Player) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; }> = ({ icon, title, value }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md flex items-center space-x-4 transition-all hover:shadow-lg hover:scale-105">
    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <p className="text-slate-900 dark:text-white text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
        <div className="h-64">
            {children}
        </div>
    </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
      isActive
        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
    }`}
  >
    {children}
  </button>
);


export const Dashboard: React.FC<DashboardProps> = ({ players, matches, onPlayerSelect, onEditPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'directory'>('overview');

  const filteredPlayers = useMemo(() => 
    players.filter(player =>
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.jerseyNumber && player.jerseyNumber.toString().includes(searchTerm))
    ), [players, searchTerm]);

  const { items: sortedPlayers, requestSort, sortConfig } = useSortableData(filteredPlayers);
  
  const getSortDirection = (key: keyof Player) => {
      if (!sortConfig || sortConfig.key !== key) return null;
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
  }
  
  const totalFeesCollected = matches
    .filter(m => m.status === 'Completed')
    .reduce((total, match) => {
        const fee = match.feePerPlayer ?? MATCH_FEE_PER_PLAYER;
        const paidCount = Object.values(match.fees).filter(status => status === 'Paid').length;
        return total + (paidCount * fee);
    }, 0);

  const newestMember = useMemo(() => {
    if (players.length === 0) return 'N/A';
    return [...players].sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())[0].fullName;
  }, [players]);
    
    const registrationData = useMemo(() => {
        const monthMap: {[key: string]: number} = {};
        players.forEach(player => {
            const month = new Date(player.registrationDate).toLocaleString('default', { month: 'short', year: '2-digit' });
            monthMap[month] = (monthMap[month] || 0) + 1;
        });
        return Object.entries(monthMap)
            .map(([name, players]) => ({ name, players }))
            .sort((a,b) => new Date(a.name) > new Date(b.name) ? 1 : -1);
    }, [players]);

    const earningsData = useMemo(() => {
        return matches
            .filter(m => m.status === 'Completed')
            .map(match => {
                const fee = match.feePerPlayer ?? MATCH_FEE_PER_PLAYER;
                const earnings = Object.values(match.fees).filter(s => s === 'Paid').length * fee;
                return { name: match.name, earnings };
            });
    }, [matches]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h2>
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="flex space-x-2" aria-label="Tabs">
                <TabButton isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                    Analytics Overview
                </TabButton>
                <TabButton isActive={activeTab === 'directory'} onClick={() => setActiveTab('directory')}>
                    Player Directory
                </TabButton>
            </nav>
        </div>

        {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in-0">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<UsersIcon />} title="Total Players" value={players.length} />
                    <StatCard icon={<CricketBallIcon />} title="Completed Matches" value={matches.filter(m => m.status === 'Completed').length} />
                    <StatCard icon={<TrophyIcon />} title="Total Earnings" value={`₹${totalFeesCollected.toFixed(2)}`} />
                    <StatCard icon={<TrendingUpIcon />} title="Newest Member" value={newestMember} />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3">
                        <ChartContainer title="Player Registration Growth">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={registrationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="players" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                    <div className="lg:col-span-3">
                        <ChartContainer title="Earnings per Match">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={earningsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip cursor={{fill: 'rgba(100, 116, 139, 0.1)'}} />
                                    <Legend />
                                    <Bar dataKey="earnings" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </div>
            </div>
        )}
        
        {activeTab === 'directory' && (
            <div className="animate-in fade-in-0">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Players ({players.length})</h3>
                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <SearchIcon />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name or jersey..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        {([
                            { key: 'fullName', label: 'Name' },
                            { key: 'jerseyNumber', label: 'Jersey #' },
                            { key: 'role', label: 'Role' },
                            { key: 'dob', label: 'DOB' },
                            { key: 'gender', label: 'Gender' },
                            { key: 'state', label: 'State' },
                            { key: 'country', label: 'Country' }
                        ] as {key: keyof Player, label: string}[]).map(({ key, label }) => (
                          <th key={key} className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            <button onClick={() => requestSort(key)} className="hover:text-orange-500 flex items-center gap-2">
                              {label} <span className="text-orange-500">{getSortDirection(key)}</span>
                            </button>
                          </th>
                        ))}
                         <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {sortedPlayers.map(player => (
                        <tr key={player.id} onClick={() => onPlayerSelect(player)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-200">
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center space-x-4">
                                <img className="h-10 w-10 rounded-full object-cover" src={player.photoUrl} alt={player.fullName} />
                                <div>
                                    <div className="flex items-center gap-2">
                                      <div className="font-semibold text-gray-900 dark:text-white">{player.fullName}</div>
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{player.email}</div>
                                </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono">{player.jerseyNumber || 'N/A'}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap"><div className="flex items-center gap-2"><PlayerRoleIcon role={player.role} />{player.role}</div></td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{new Date(player.dob).toLocaleDateString()}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{player.gender}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{player.state}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{player.country}</td>
                          <td className="p-4 whitespace-nowrap text-right">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditPlayer(player);
                                }}
                                className="p-2 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                aria-label={`Edit ${player.fullName}`}
                            >
                                <EditIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};