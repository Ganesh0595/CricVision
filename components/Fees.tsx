

import React, { useState, useMemo } from 'react';
import { Match, Player, FeeStatus, PlayerRole } from '../types';
import { MATCH_FEE_PER_PLAYER } from '../constants';
import { BatIcon, BowlingIcon, AllRounderIcon, WhatsAppIcon, InstagramIcon, MessageIcon, ShareIcon, UsersIcon, RupeeIcon } from './Icons';

interface FeesProps {
  matches: Match[];
  players: Player[];
  onUpdateMatch: (updatedMatch: Match) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const getStatusClass = (status: FeeStatus) => {
    switch(status) {
        case 'Paid': return 'bg-emerald-500';
        case 'Unpaid': return 'bg-rose-500';
        case 'Exempt': return 'bg-slate-500';
        default: return 'bg-gray-500';
    }
};

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const FeeEditor: React.FC<{
    match: Match;
    players: Player[];
    onSave: (fees: { [playerId: string]: FeeStatus }, feePerPlayer: number) => void;
    onCancel: () => void;
}> = ({ match, players, onSave, onCancel }) => {
    const [editableFees, setEditableFees] = useState(match.fees);
    const [editableFeePerPlayer, setEditableFeePerPlayer] = useState(match.feePerPlayer ?? MATCH_FEE_PER_PLAYER);

    const getPlayer = (id: string) => players.find(p => p.id === id);
    
    const handleStatusChange = (playerId: string, status: FeeStatus) => {
        setEditableFees(prev => ({ ...prev, [playerId]: status }));
    };

    const playersToShow = useMemo(() => {
        if (match.winner) {
            const loserTeamName = Object.keys(match.teams).find(name => name !== match.winner);
            const playerIds = loserTeamName ? match.teams[loserTeamName] : [];
            return playerIds.map(getPlayer).filter((p): p is Player => !!p);
        }
        // For ties or other cases, show all players
        return match.players.map(getPlayer).filter((p): p is Player => !!p);
    }, [match, players]);
    
    const teamName = match.winner ? `Loser Team: ${Object.keys(match.teams).find(name => name !== match.winner)}` : 'All Players (Tie/No Winner)';
    
    return (
      <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg space-y-4">
        <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{teamName}</h4>
        <div className="flex items-center gap-2">
            <label htmlFor={`fee-amount-${match.id}`} className="font-semibold text-gray-700 dark:text-gray-300">Fee per Player:</label>
            <span className="text-lg font-bold text-amber-500 dark:text-amber-400">₹</span>
            <input 
                id={`fee-amount-${match.id}`}
                type="number" 
                value={editableFeePerPlayer} 
                onChange={e => setEditableFeePerPlayer(parseInt(e.target.value, 10) || 0)} 
                className="w-24 bg-slate-200 dark:bg-slate-700 p-1 rounded-md text-lg font-bold text-amber-500 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
        </div>
        <ul className="space-y-3">
           {playersToShow.map(player => (
               <li key={player.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-md bg-white dark:bg-slate-800 gap-3">
                   <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                       <img src={player.photoUrl} alt={player.fullName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                       <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{player.fullName}</span>
                   </div>
                   <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                       {(['Unpaid', 'Paid', 'Exempt'] as FeeStatus[]).map(status => (
                           <button 
                             key={status}
                             onClick={() => handleStatusChange(player.id, status)} 
                             className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all flex-1 sm:flex-none ${editableFees[player.id] === status ? `${getStatusClass(status)} text-white ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-orange-500` : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                           >
                               {status}
                           </button>
                       ))}
                   </div>
               </li>
           ))}
        </ul>
        <div className="flex justify-end gap-3 pt-4">
            <button onClick={onCancel} className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors">
              Cancel
            </button>
            <button onClick={() => onSave(editableFees, editableFeePerPlayer)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
              Save Changes
            </button>
        </div>
      </div>
    );
};

const ShareModal: React.FC<{
    match: Match;
    player: Player;
    onClose: () => void;
    onShowToast: (message: string, type: 'success' | 'error') => void;
}> = ({ match, player, onClose, onShowToast }) => {
    const fee = match.feePerPlayer ?? MATCH_FEE_PER_PLAYER;
    const message = `Hi ${player.fullName} 👋, this is a friendly reminder for your pending match fee of ₹${fee} for the game "${match.name}". Please pay at your earliest convenience. Thank you! 🙏 - BCC Pune`;
    const encodedMessage = encodeURIComponent(message);

    const handleCopy = () => {
        navigator.clipboard.writeText(message)
            .then(() => onShowToast('Message copied to clipboard!', 'success'))
            .catch(() => onShowToast('Failed to copy message.', 'error'));
    };

    const handleWebShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Match Fee Reminder',
                    text: message,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            onShowToast('Web Share API is not supported in your browser.', 'error');
        }
    };

    const shareOptions = [
        { name: 'WhatsApp', icon: <WhatsAppIcon className="h-7 w-7 text-emerald-500" />, href: `https://wa.me/?text=${encodedMessage}`, action: 'link' },
        { name: 'Text Message', icon: <MessageIcon className="h-7 w-7 text-sky-500" />, href: `sms:?&body=${encodedMessage}`, action: 'link' },
        { name: 'Instagram', icon: <InstagramIcon className="h-7 w-7 text-rose-500" />, action: 'copy' },
        ...(navigator.share ? [{ name: 'Other', icon: <ShareIcon className="h-7 w-7 text-slate-500" />, action: 'share' }] : []),
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in fade-in-0 zoom-in-95" onClick={e => e.stopPropagation()}>

                {/* Colorful Reminder Card */}
                <div className="bg-gradient-to-tr from-rose-500 via-red-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-12 -left-4 w-40 h-40 bg-white/10 rounded-full"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <img src={player.photoUrl} alt={player.fullName} className="h-16 w-16 rounded-full object-cover border-4 border-white/30" />
                            <div>
                                <p className="text-sm text-white/80">Payment Reminder</p>
                                <h4 className="font-bold text-xl text-white">{player.fullName}</h4>
                            </div>
                        </div>
                        <div className="mt-4 border-t border-white/20 pt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/80">Match:</span>
                                <span className="font-semibold text-right">{match.name}</span>
                            </div>
                            <div className="mt-4 flex justify-between items-baseline bg-black/20 p-3 rounded-lg">
                                <span className="font-bold text-lg text-white/90">Amount Due:</span>
                                <span className="font-extrabold text-3xl text-yellow-300">₹{fee}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-3">Select an app to send the reminder:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                         {shareOptions.map(opt => {
                            const content = (
                                <>
                                    {opt.icon}
                                    <span className="text-xs font-semibold mt-1">{opt.name}</span>
                                    {opt.action === 'copy' && <span className="text-[10px] text-slate-400">(Copy Msg)</span>}
                                </>
                            );
                            if (opt.action === 'link') {
                                return <a key={opt.name} href={opt.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">{content}</a>;
                            }
                            return <button key={opt.name} onClick={opt.action === 'copy' ? handleCopy : handleWebShare} className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">{content}</button>;
                        })}
                    </div>
                </div>

                <div className="mt-2 text-center">
                    <button onClick={onClose} className="px-6 py-2 text-sm text-slate-600 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

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

const PlayerRoleIcon: React.FC<{ role: PlayerRole, className?: string }> = ({ role, className = "h-4 w-4 text-slate-500 dark:text-slate-400" }) => {
    switch (role) {
        case PlayerRole.Batter: return <BatIcon className={className} />;
        case PlayerRole.Bowler: return <BowlingIcon className={className} />;
        case PlayerRole.AllRounder: return <AllRounderIcon className={className} />;
        default: return null;
    }
};

export const Fees: React.FC<FeesProps> = ({ matches, players, onUpdateMatch, onShowToast }) => {
  const completedMatches = matches.filter(m => m.status === 'Completed');
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'status' | 'reminder'>('summary');
  const [shareTarget, setShareTarget] = useState<{ match: Match; player: Player } | null>(null);

  const matchesWithUnpaidLosers = useMemo(() => {
    return completedMatches
      .map(match => {
        if (!match.winner) return null; // No loser if no winner (e.g., tie, abandoned)
        
        const loserTeamName = Object.keys(match.teams).find(name => name !== match.winner);
        if (!loserTeamName) return null;

        const loserPlayerIds = match.teams[loserTeamName];
        const unpaidLosers = loserPlayerIds
          .filter(pId => match.fees[pId] === 'Unpaid')
          .map(pId => players.find(p => p.id === pId))
          .filter((p): p is Player => !!p);

        if (unpaidLosers.length === 0) return null;
        
        return {
          ...match,
          unpaidLosers,
          loserTeamName,
        };
      })
      .filter((m): m is (Match & { unpaidLosers: Player[], loserTeamName: string }) => !!m);
  }, [completedMatches, players]);


  const totalFeesCollected = completedMatches.reduce((total, match) => {
    const fee = match.feePerPlayer ?? MATCH_FEE_PER_PLAYER;
    const paidCount = Object.values(match.fees).filter(status => status === 'Paid').length;
    return total + (paidCount * fee);
  }, 0);

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.fullName || 'Unknown Player';
  };

  const handleSave = (match: Match, fees: { [playerId: string]: FeeStatus }, feePerPlayer: number) => {
      onUpdateMatch({ ...match, fees, feePerPlayer });
      setEditingMatchId(null);
  };
  
  const handleGroupShareClick = (match: Match & { unpaidLosers: Player[], loserTeamName: string }) => {
    const fee = match.feePerPlayer ?? MATCH_FEE_PER_PLAYER;
    const captainId = match.captains?.[match.loserTeamName];
    const captainName = captainId ? players.find(p => p.id === captainId)?.fullName : 'N/A';
    
    const unpaidPlayerNames = match.unpaidLosers.map(p => `- *_${p.fullName}_*`).join('\n');

    const message = `🚨 *BCC Pune: Fee Reminder* 🚨

Just a friendly reminder regarding the outstanding fees for the match: *"${match.name}"*.

*Team:* ${match.loserTeamName} (Captain: ${captainName})
*Date:* ${new Date(match.date).toDateString()}
*Amount:* *₹${fee}* per player

The following players are requested to clear their dues:
${unpaidPlayerNames}

Thank you for your cooperation! 🙏`;

    if (navigator.share) {
        navigator.share({
            title: `Fee Reminder for ${match.name}`,
            text: message,
        }).catch(error => console.error('Error sharing:', error));
    } else {
        navigator.clipboard.writeText(message)
            .then(() => onShowToast('Group reminder message copied!', 'success'))
            .catch(() => onShowToast('Failed to copy message.', 'error'));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Fee Management</h2>
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="flex space-x-2" aria-label="Tabs">
                <TabButton isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
                    Summary
                </TabButton>
                <TabButton isActive={activeTab === 'status'} onClick={() => setActiveTab('status')}>
                    Per-Match Status
                </TabButton>
                <TabButton isActive={activeTab === 'reminder'} onClick={() => setActiveTab('reminder')}>
                    Send Reminder
                </TabButton>
            </nav>
        </div>

        {activeTab === 'summary' && (
            <div className="animate-in fade-in-0">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Fee statistics for matches completed in the last 7 days.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-xl">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completed Matches (in last 7 days)</p>
                        <p className="text-gray-900 dark:text-white text-3xl font-bold">{completedMatches.length}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-xl">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Fees Collected (from these matches)</p>
                        <p className="text-gray-900 dark:text-white text-3xl font-bold">₹{totalFeesCollected.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'status' && (
            <div className="animate-in fade-in-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Completed Match Fee Status</h3>
                <div className="space-y-4">
                  {completedMatches.map(match => {
                    const isExpanded = expandedMatchId === match.id;
                    const isEditing = editingMatchId === match.id;
                    const isTie = !match.winner && match.resultDescription?.toLowerCase().includes('tie');

                    return (
                      <div key={match.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shadow-sm overflow-hidden">
                        <div 
                          className="p-4 flex justify-between items-center cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
                          onClick={() => {
                            if (!isEditing) {
                                setExpandedMatchId(isExpanded ? null : match.id);
                            }
                          }}
                        >
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{match.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(match.date).toDateString()} - <span className="font-semibold text-amber-600 dark:text-amber-400">{match.resultDescription || 'Result Pending'}</span></p>
                          </div>
                           <ChevronDownIcon className={`h-5 w-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[20000px]' : 'max-h-0'}`}>
                            <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                              <div className="pt-4">
                                {isEditing ? (
                                    <FeeEditor 
                                        match={match}
                                        players={players}
                                        onSave={(fees, feePerPlayer) => handleSave(match, fees, feePerPlayer)}
                                        onCancel={() => setEditingMatchId(null)}
                                    />
                                ) : (
                                  <>
                                    <div className="flex justify-end mb-4">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingMatchId(match.id); }} disabled={isTie} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400">
                                            Edit Fees
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                      {match.winner ? (
                                        <>
                                          {/* Winner's Team */}
                                          <div>
                                            <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Winner: {match.winner}</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                              {match.teams[match.winner]?.map(playerId => (
                                                <div key={playerId} className="flex items-center space-x-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                                                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate" title={getPlayerName(playerId)}>
                                                    {getPlayerName(playerId)}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Loser's Team */}
                                          <div>
                                            <h4 className="font-semibold text-rose-600 dark:text-rose-400 mb-2">Loser: {Object.keys(match.teams).find(name => name !== match.winner)}</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                              {Object.entries(match.teams)
                                                .filter(([teamName]) => teamName !== match.winner)
                                                .flatMap(([, playerIds]) => playerIds)
                                                .map(playerId => {
                                                  const status = match.fees[playerId] || 'Unpaid';
                                                  return (
                                                    <div key={playerId} className="flex items-center space-x-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                      <span className={`h-2.5 w-2.5 rounded-full ${getStatusClass(status)}`}></span>
                                                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate" title={getPlayerName(playerId)}>
                                                        {getPlayerName(playerId)}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                            </div>
                                          </div>
                                        </>
                                      ) : isTie ? (
                                        <div>
                                            <h4 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Match Tied - All Players Exempt</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {match.players.map(playerId => (
                                                <div key={playerId} className="flex items-center space-x-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                                                <span className="text-sm text-gray-800 dark:text-gray-200 truncate" title={getPlayerName(playerId)}>
                                                    {getPlayerName(playerId)}
                                                </span>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                      ) : (
                                        // Fallback for no winner and not a tie (e.g., abandoned)
                                        <>
                                          {Object.entries(match.teams).map(([teamName, playerIds]) => (
                                            <div key={teamName}>
                                              <h4 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Team: {teamName}</h4>
                                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                {playerIds.map(playerId => {
                                                  const status = match.fees[playerId] || 'Unpaid';
                                                  return (
                                                    <div key={playerId} className="flex items-center space-x-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                                      <span className={`h-2.5 w-2.5 rounded-full ${getStatusClass(status)}`}></span>
                                                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate" title={getPlayerName(playerId)}>
                                                        {getPlayerName(playerId)}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                  {completedMatches.length === 0 && <p className="text-center text-slate-500 py-8">No matches have been completed in the last 7 days.</p>}
                </div>
            </div>
        )}
        
        {activeTab === 'reminder' && (
          <div className="animate-in fade-in-0 space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Unpaid Fee Reminders</h3>
              <p className="text-slate-500 dark:text-slate-400 -mt-4">
                  Below is a list of players from losing teams who have not yet paid their match fees.
              </p>
              {matchesWithUnpaidLosers.length > 0 ? (
                matchesWithUnpaidLosers.map(match => (
                  <div key={match.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{match.name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(match.date).toDateString()} - Loser: {match.loserTeamName}
                            </p>
                          </div>
                          <button
                              onClick={() => handleGroupShareClick(match)}
                              disabled={match.unpaidLosers.length <= 1}
                              className="p-2 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Share group reminder for ${match.name}`}
                              title={match.unpaidLosers.length <= 1 ? "Group reminder available for 2 or more players" : "Send group reminder"}
                          >
                              <UsersIcon className="h-6 w-6" />
                          </button>
                      </div>
                      <ul className="space-y-3">
                          {match.unpaidLosers.map(player => {
                              const isCaptain = match.captains?.[match.loserTeamName] === player.id;
                              return (
                                  <li key={player.id} className="flex flex-row items-center justify-between p-3 rounded-md bg-white dark:bg-slate-800 gap-3">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <img src={player.photoUrl} alt={player.fullName} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                                          <div className="flex-1 truncate">
                                              <div className="flex items-center gap-2">
                                                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{player.fullName}</span>
                                                  {isCaptain && <span className="px-2 py-0.5 text-xs font-bold tracking-wide text-amber-800 bg-amber-200 dark:text-white dark:bg-amber-600 rounded-full">Captain</span>}
                                              </div>
                                              <div className="flex items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                                <div className="flex items-center gap-1"><PlayerRoleIcon role={player.role} /> {player.role}</div>
                                                {player.jerseyNumber != null && <span>#{player.jerseyNumber}</span>}
                                              </div>
                                          </div>
                                      </div>
                                      <button
                                          onClick={() => setShareTarget({ match, player })}
                                          className="flex-shrink-0 p-2 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                          aria-label={`Share reminder with ${player.fullName}`}
                                      >
                                          <ShareIcon className="h-6 w-6" />
                                      </button>
                                  </li>
                              )
                          })}
                      </ul>
                  </div>
                ))
              ) : (
                 <div className="text-center p-8 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">All fees settled!</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">There are no outstanding fees for losing team members.</p>
                </div>
              )}
          </div>
        )}
      </div>
      {shareTarget && (
        <ShareModal 
            match={shareTarget.match}
            player={shareTarget.player}
            onClose={() => setShareTarget(null)}
            onShowToast={onShowToast}
        />
      )}
    </div>
  );
};