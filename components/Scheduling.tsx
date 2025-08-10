

import React, { useState, useMemo } from 'react';
import { Match, Player, PlayerRole } from '../types';
import { PlusCircleIcon, MinusCircleIcon, SearchIcon, BatIcon, BowlingIcon, AllRounderIcon, TrophyIcon, UsersIcon, ClockIcon, CalendarSmallIcon, CricketBallIcon, CalendarIcon, ChevronDownIcon, PdfIcon } from './Icons';
import { MATCH_FEE_PER_PLAYER } from '../constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SchedulingProps {
  players: Player[];
  matches: Match[];
  onAddMatch: (newMatch: Omit<Match, 'id'>) => void;
  onStartMatch: (matchId: string) => void;
  onViewScorecard: (match: Match) => void;
}

const PlayerRoleIcon: React.FC<{ role: PlayerRole }> = ({ role }) => {
    const iconProps = { className: "h-4 w-4 text-slate-500 dark:text-slate-400" };
    switch (role) {
        case PlayerRole.Batter: return <BatIcon {...iconProps} />;
        case PlayerRole.Bowler: return <BowlingIcon {...iconProps} />;
        case PlayerRole.AllRounder: return <AllRounderIcon {...iconProps} />;
        default: return null;
    }
};

const PlayerListItem: React.FC<{ player: Player; onAction: () => void; actionIcon: React.ReactNode }> = ({ player, onAction, actionIcon }) => (
    <li className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <img src={player.photoUrl} alt={player.fullName} className="h-9 w-9 rounded-full object-cover" />
        <div className="flex flex-col">
          <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-baseline gap-2">
            <span>{player.fullName}</span>
            {player.jerseyNumber && <span className="text-xs font-mono text-slate-500 dark:text-slate-400">#{player.jerseyNumber}</span>}
          </div>
           <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
             <PlayerRoleIcon role={player.role} />
             <span>{player.role}</span>
          </div>
        </div>
      </div>
      <button onClick={onAction} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
        {actionIcon}
      </button>
    </li>
);

const InputGroup: React.FC<{ icon: React.ReactNode; children: React.ReactNode; label: string; }> = ({ icon, children, label }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                {icon}
            </div>
            {children}
        </div>
    </div>
);

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
    }`}
  >
    {children}
  </button>
);


export const Scheduling: React.FC<SchedulingProps> = ({ players, matches, onAddMatch, onStartMatch, onViewScorecard }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'schedule' | 'squads'>('create');
  const [matchName, setMatchName] = useState('');
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [matchTime, setMatchTime] = useState('07:00');
  const [totalOvers, setTotalOvers] = useState('10');
  const [teamACaptainId, setTeamACaptainId] = useState<string | null>(null);
  const [teamBCaptainId, setTeamBCaptainId] = useState<string | null>(null);
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<string[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<'A' | 'B'>('A');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const getPlayerName = (id: string | null) => players.find(p => p.id === id)?.fullName || '';
  
  const teamAName = teamACaptainId ? `${getPlayerName(teamACaptainId)}'s XI` : 'Team A';
  const teamBName = teamBCaptainId ? `${getPlayerName(teamBCaptainId)}'s XI` : 'Team B';

  const handleCaptainSelect = (playerId: string, team: 'A' | 'B') => {
      if (team === 'A') {
          if (teamACaptainId) {
              setTeamAPlayerIds(prev => prev.filter(id => id !== teamACaptainId));
          }
          setTeamACaptainId(playerId);
          setTeamAPlayerIds(prev => [...new Set([...prev, playerId])]);
      } else {
          if (teamBCaptainId) {
              setTeamBPlayerIds(prev => prev.filter(id => id !== teamBCaptainId));
          }
          setTeamBCaptainId(playerId);
          setTeamBPlayerIds(prev => [...new Set([...prev, playerId])]);
      }
  };

  const availablePlayersForCaptainB = players.filter(p => p.id !== teamACaptainId);

  const selectedPlayerIds = useMemo(() => editingTeam === 'A' ? teamAPlayerIds : teamBPlayerIds, [editingTeam, teamAPlayerIds, teamBPlayerIds]);
  const setSelectedPlayerIds = useMemo(() => editingTeam === 'A' ? setTeamAPlayerIds : setTeamBPlayerIds, [editingTeam]);

  const availablePlayers = useMemo(() => {
    const allSelectedIds = new Set([...teamAPlayerIds, ...teamBPlayerIds]);
    return players
      .filter(p => !allSelectedIds.has(p.id))
      .filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || (p.jerseyNumber && p.jerseyNumber.toString().includes(searchTerm)));
  }, [players, teamAPlayerIds, teamBPlayerIds, searchTerm]);

  const selectedPlayers = useMemo(() => {
    return players.filter(p => selectedPlayerIds.includes(p.id));
  }, [players, selectedPlayerIds]);
  
  const completedMatches = useMemo(() => {
    return [...matches]
        .filter(m => m.status === 'Completed')
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matches]);

  const addPlayer = (playerId: string) => setSelectedPlayerIds(prev => [...prev, playerId]);
  
  const removePlayer = (playerId: string) => {
    if ((editingTeam === 'A' && playerId === teamACaptainId) || (editingTeam === 'B' && playerId === teamBCaptainId)) {
        return; // Captains cannot be removed from the list this way
    }
    setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!matchName || !matchDate || !matchTime || !totalOvers || !teamACaptainId || !teamBCaptainId) {
      alert('Please fill all match details and select captains for both teams.');
      return;
    }
    if (teamAPlayerIds.length < 11 || teamBPlayerIds.length < 11) {
      alert('Both teams must have at least 11 players.');
      return;
    }
    
    const allPlayerIds = [...new Set([...teamAPlayerIds, ...teamBPlayerIds])];
    
    onAddMatch({
      name: matchName,
      date: matchDate,
      time: matchTime,
      totalOvers: parseInt(totalOvers, 10),
      players: allPlayerIds,
      teams: { [teamAName]: teamAPlayerIds, [teamBName]: teamBPlayerIds },
      captains: { [teamAName]: teamACaptainId, [teamBName]: teamBCaptainId },
      status: 'Scheduled',
      feePerPlayer: MATCH_FEE_PER_PLAYER,
      fees: allPlayerIds.reduce((acc, playerId) => ({ ...acc, [playerId]: 'Unpaid' }), {}),
      tieBreakers: [],
    });

    setMatchName('');
    setMatchDate(new Date().toISOString().split('T')[0]);
    setMatchTime('07:00');
    setTotalOvers('10');
    setTeamACaptainId(null); setTeamBCaptainId(null);
    setTeamAPlayerIds([]); setTeamBPlayerIds([]);
    setSearchTerm('');
    setActiveTab('schedule');
  };
  
  const handleDownloadSquadsPDF = () => {
    const doc = new (jsPDF as any)();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Completed Match Squads Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    let startY = 40;

    completedMatches.forEach((match, index) => {
        if (startY > 240 && index > 0) {
            doc.addPage();
            startY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(match.name, 14, startY);
        startY += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${new Date(match.date).toDateString()} - ${match.resultDescription || `Winner: ${match.winner}`}`, 14, startY);
        startY += 10;
        doc.setTextColor(0);

        Object.entries(match.teams).forEach(([teamName, playerIds]) => {
            const isWinner = match.winner === teamName;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(`${teamName} ${isWinner ? '(Winner)' : ''}`, 14, startY);
            startY += 6;

            const tableBody = playerIds.map(pId => {
                const player = players.find(p => p.id === pId);
                if (!player) return ['Unknown Player', '', '', ''];
                const isCaptain = match.captains?.[teamName] === pId;
                return [
                    player.fullName,
                    player.role,
                    player.jerseyNumber ?? 'N/A',
                    isCaptain ? 'Captain' : ''
                ];
            });

            (doc as any).autoTable({
                head: [['Player', 'Role', 'Jersey #', 'Notes']],
                body: tableBody,
                startY: startY,
                theme: 'striped',
                headStyles: { fillColor: isWinner ? [22, 160, 133] : [41, 128, 185] },
            });

            startY = (doc as any).lastAutoTable.finalY + 10;
        });

        if (index < completedMatches.length - 1) {
            startY += 5;
            doc.setDrawColor(220, 220, 220);
            doc.line(14, startY, doc.internal.pageSize.getWidth() - 14, startY);
            startY += 10;
        }
    });

    doc.save('BCC_Completed_Squads.pdf');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Match Management</h2>
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="flex space-x-2" aria-label="Tabs">
                <TabButton isActive={activeTab === 'create'} onClick={() => setActiveTab('create')}>
                    Create New Match
                </TabButton>
                <TabButton isActive={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')}>
                    Match Schedule
                </TabButton>
                <TabButton isActive={activeTab === 'squads'} onClick={() => setActiveTab('squads')}>
                    Completed Squads
                </TabButton>
            </nav>
        </div>

        {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in-0">
              {/* Section 1: Match Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Match Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <InputGroup label="Match Name" icon={<TrophyIcon className="h-5 w-5" />}>
                    <input type="text" value={matchName} onChange={e => setMatchName(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Champions Cup" required />
                  </InputGroup>
                  <InputGroup label="Date" icon={<CalendarSmallIcon />}>
                    <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </InputGroup>
                  <InputGroup label="Time" icon={<ClockIcon className="h-5 w-5" />}>
                    <input type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </InputGroup>
                  <InputGroup label="Total Overs" icon={<CricketBallIcon className="h-5 w-5" />}>
                    <input type="number" value={totalOvers} onChange={e => setTotalOvers(e.target.value)} min="1" className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 20" required />
                  </InputGroup>
                </div>
              </section>
              
              {/* Section 2: Team Setup */}
               <section>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Team Setup</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Team A Captain" icon={<UsersIcon className="h-5 w-5" />}>
                      <select
                        value={teamACaptainId || ''}
                        onChange={e => handleCaptainSelect(e.target.value, 'A')}
                        className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" required
                      >
                        <option value="" disabled>Select Team A Captain</option>
                        {players.map(p => (
                          <option key={p.id} value={p.id}>{p.fullName}</option>
                        ))}
                      </select>
                    </InputGroup>
                    <InputGroup label="Team B Captain" icon={<UsersIcon className="h-5 w-5" />}>
                       <select
                        value={teamBCaptainId || ''}
                        onChange={e => handleCaptainSelect(e.target.value, 'B')}
                        className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" required
                        disabled={!teamACaptainId}
                      >
                        <option value="" disabled>Select Team B Captain</option>
                        {availablePlayersForCaptainB.map(p => (
                          <option key={p.id} value={p.id}>{p.fullName}</option>
                        ))}
                      </select>
                    </InputGroup>
                </div>
              </section>
              
              <fieldset 
                disabled={!teamACaptainId || !teamBCaptainId}
                className="space-y-8 disabled:opacity-50 disabled:pointer-events-none transition-opacity duration-300"
              >
                 {/* Section 3: Player Rosters */}
                 <section>
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Build Your Squads</h3>
                     <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button type="button" onClick={() => setEditingTeam('A')} className={`flex-1 p-3 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${editingTeam === 'A' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                            <span>{teamAName}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${editingTeam === 'A' ? 'bg-indigo-200 dark:bg-indigo-500/50 text-indigo-800 dark:text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'}`}>{teamAPlayerIds.length}</span>
                        </button>
                        <button type="button" onClick={() => setEditingTeam('B')} className={`flex-1 p-3 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${editingTeam === 'B' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                            <span>{teamBName}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${editingTeam === 'B' ? 'bg-indigo-200 dark:bg-indigo-500/50 text-indigo-800 dark:text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'}`}>{teamBPlayerIds.length}</span>
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Available Players ({availablePlayers.length})</h4>
                          <InputGroup icon={<SearchIcon />} label="">
                            <input type="text" placeholder="Search by name or jersey..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 mb-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </InputGroup>
                          <ul className="space-y-1 p-2 h-72 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            {availablePlayers.length > 0 ? (availablePlayers.map(p => <PlayerListItem key={p.id} player={p} onAction={() => addPlayer(p.id)} actionIcon={<PlusCircleIcon className="h-6 w-6 text-emerald-500 hover:text-emerald-600" />} />)) : (<p className="text-center text-slate-500 p-4">No available players found.</p>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Selected for {editingTeam === 'A' ? teamAName : teamBName} ({selectedPlayers.length})</h4>
                          <div className="p-2 h-80 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            {selectedPlayers.length > 0 ? (<ul className="space-y-1">
                              {selectedPlayers.map(p => {
                                  const isCaptain = (editingTeam === 'A' && p.id === teamACaptainId) || (editingTeam === 'B' && p.id === teamBCaptainId);
                                  return (
                                     <PlayerListItem 
                                      key={p.id} 
                                      player={p} 
                                      onAction={() => removePlayer(p.id)} 
                                      actionIcon={isCaptain ? <span className="text-amber-400 font-bold text-xs mr-2">(C)</span> : <MinusCircleIcon className="h-6 w-6 text-rose-500 hover:text-rose-600" />}
                                     />
                                  )
                              })}
                              </ul>) : (<div className="flex items-center justify-center h-full"><p className="text-center text-slate-500">No players selected yet.</p></div>)}
                          </div>
                        </div>
                      </div>
                 </section>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                  <button type="submit" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:scale-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={teamAPlayerIds.length < 11 || teamBPlayerIds.length < 11}>
                    <CalendarIcon />
                    <span>Schedule Match</span>
                  </button>
                </div>
              </fieldset>
            </form>
        )}

        {activeTab === 'schedule' && (
            <div className="animate-in fade-in-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">All Matches</h3>
                <div className="space-y-4">
                  {[...matches].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(match => (
                    <div key={match.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700">
                      <div>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{match.name}</p>
                        <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <CalendarSmallIcon className="h-4 w-4" />
                                <span>{new Date(match.date).toDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ClockIcon className="h-4 w-4" />
                                <span>{match.time}</span>
                            </div>
                            {match.totalOvers && (
                                <div className="flex items-center gap-1.5">
                                    <CricketBallIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <span>{match.totalOvers} Over Match</span>
                                </div>
                            )}
                            {Object.entries(match.teams).map(([teamName, players]) => (
                               <div key={teamName} className="flex items-center gap-1.5">
                                   <UsersIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                   <span><strong>{teamName}:</strong> {players.length} players</span>
                               </div>
                            ))}
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 flex flex-shrink-0 items-center gap-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          match.status === 'Scheduled' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' :
                          match.status === 'Live' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 animate-pulse' :
                          match.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                        }`}>
                          {match.status}
                        </span>
                        {match.status === 'Scheduled' && (
                          <button onClick={() => onStartMatch(match.id)} className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                            Start Match
                          </button>
                        )}
                        {match.status === 'Live' && (
                          <button onClick={() => onStartMatch(match.id)} className="px-4 py-1.5 bg-rose-600 text-white text-sm rounded-lg font-semibold hover:bg-rose-700 transition-colors">
                            Score Match
                          </button>
                        )}
                         {match.status === 'Completed' && (
                          <button onClick={() => onViewScorecard(match)} className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                            View Scorecard
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {matches.length === 0 && <p className="text-center text-slate-500 py-8">No matches scheduled yet.</p>}
                </div>
            </div>
        )}

        {activeTab === 'squads' && (
            <div className="animate-in fade-in-0">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Completed Match Squads</h3>
                    <button
                        onClick={handleDownloadSquadsPDF}
                        disabled={completedMatches.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        <PdfIcon className="h-5 w-5" />
                        <span>Download as PDF</span>
                    </button>
                </div>
                <div className="space-y-4">
                  {completedMatches.map(match => {
                    const isExpanded = expandedMatchId === match.id;
                    return (
                        <div key={match.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shadow-sm overflow-hidden">
                            <button
                                className="w-full p-4 flex justify-between items-center text-left cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                            >
                                <div>
                                    <p className="font-bold text-lg text-gray-900 dark:text-white">{match.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {new Date(match.date).toDateString()} - 
                                        <span className="font-semibold text-amber-600 dark:text-amber-400 ml-1">{match.resultDescription || `Winner: ${match.winner}`}</span>
                                    </p>
                                </div>
                                <ChevronDownIcon className={`h-5 w-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {Object.entries(match.teams).map(([teamName, playerIds]) => {
                                            const isWinner = match.winner === teamName;
                                            const captainId = match.captains?.[teamName];
                                            return (
                                                <div key={teamName}>
                                                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                        {teamName}
                                                        {isWinner && <TrophyIcon className="h-5 w-5 text-amber-500" />}
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {playerIds.map(pId => {
                                                            const player = players.find(p => p.id === pId);
                                                            if (!player) return null;
                                                            const isCaptain = pId === captainId;
                                                            return (
                                                                <li key={pId}>
                                                                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                                                        <img src={player.photoUrl} alt={player.fullName} className="h-10 w-10 rounded-full object-cover"/>
                                                                        <div className="flex-grow">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-sm text-slate-800 dark:text-white">{player.fullName}</span>
                                                                                {isCaptain && (
                                                                                    <span 
                                                                                        className="px-2 py-0.5 text-xs font-bold text-amber-800 bg-amber-300 dark:text-amber-900 dark:bg-amber-400 rounded-full"
                                                                                        title="Captain"
                                                                                    >
                                                                                        C
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                                                <span>{player.role}</span>
                                                                                {player.jerseyNumber != null && <span>#{player.jerseyNumber}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                  })}
                  {completedMatches.length === 0 && <p className="text-center text-slate-500 py-8">No matches have been completed yet.</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};