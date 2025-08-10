
import React, { useMemo, useState } from 'react';
import { Player, Match, PlayerRole, Innings } from '../types';
import { BatIcon, BowlingIcon, AllRounderIcon, FileDownloadIcon, PdfIcon, ExcelIcon } from './Icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PlayerDetailsModalProps {
  player: Player | null;
  matches: Match[];
  onClose: () => void;
}

const PlayerRoleIcon: React.FC<{ role: PlayerRole; className?: string }> = ({ role, className = "h-6 w-6" }) => {
    const iconProps = { className: `${className} text-orange-500 dark:text-orange-400` };
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

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
    <span className="text-2xl font-bold text-orange-500 dark:text-orange-400">{value}</span>
    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{label}</span>
  </div>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

interface PlayerMatchStats {
  matchId: string;
  matchName: string;
  matchDate: string;
  result: 'Win' | 'Loss' | 'Tie' | 'N/A';
  resultDescription: string;
  batting?: {
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      isOut: boolean;
  };
  bowling?: {
      overs: string;
      runsConceded: number;
      wickets: number;
  };
}


export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({ player, matches, onClose }) => {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  
  const formatOvers = (balls: number) => {
    if (!balls || balls < 0) return '0.0';
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  const playerStats = useMemo(() => {
    if (!player || !matches) {
      return null;
    }

    let matchesPlayed = 0;
    let totalRuns = 0;
    let totalBallsFaced = 0;
    let totalWickets = 0;
    let totalBallsBowled = 0;
    let matchesWon = 0;
    let matchesLost = 0;

    for (const match of matches) {
      if (match.status !== 'Completed' || !match.innings) continue;

      const playerTeam = Object.keys(match.teams).find(teamName => match.teams[teamName].includes(player.id));
      
      if (playerTeam) {
        matchesPlayed++;
        if (match.winner === playerTeam) {
          matchesWon++;
        } else if (match.winner) {
          matchesLost++;
        }
      }
      
      const processInnings = (innings: any) => {
        if (!innings) return;
        // Batting stats
        if (innings.batsmenStats && innings.batsmenStats[player.id]) {
          const batStats = innings.batsmenStats[player.id];
          totalRuns += batStats.runs || 0;
          totalBallsFaced += batStats.balls || 0;
        }
        // Bowling stats
        if (innings.bowlerStats && innings.bowlerStats[player.id]) {
            const bowlStats = innings.bowlerStats[player.id];
            totalWickets += bowlStats.wickets || 0;
            totalBallsBowled += bowlStats.ballsBowled || 0;
        }
      };

      processInnings(match.innings.innings1);
      processInnings(match.innings.innings2);
    }

    return {
      matchesPlayed,
      totalRuns,
      totalBallsFaced,
      totalWickets,
      totalBallsBowled,
      matchesWon,
      matchesLost,
    };
  }, [player, matches]);
  
  const playerMatchStats = useMemo((): PlayerMatchStats[] => {
    if (!player || !matches) return [];

    return matches
      .filter(match => match.status === 'Completed' && match.players.includes(player.id) && match.innings)
      .map(match => {
        const playerTeamName = Object.keys(match.teams).find(teamName => match.teams[teamName].includes(player.id)) || 'N/A';
        
        let result: PlayerMatchStats['result'] = 'N/A';
        if (match.winner) {
            result = match.winner === playerTeamName ? 'Win' : 'Loss';
        } else if (match.resultDescription?.toLowerCase().includes('tie')) {
            result = 'Tie';
        }

        let batting: PlayerMatchStats['batting'] | undefined;
        let bowling: PlayerMatchStats['bowling'] | undefined;
        
        const processInnings = (innings: Innings | undefined) => {
            if (!innings) return;
            if (innings.batsmenStats[player.id] && innings.batsmenStats[player.id].balls > 0) {
                batting = innings.batsmenStats[player.id];
            }
             if (innings.bowlerStats[player.id] && innings.bowlerStats[player.id].ballsBowled > 0) {
                const bStats = innings.bowlerStats[player.id];
                bowling = {
                    overs: formatOvers(bStats.ballsBowled),
                    runsConceded: bStats.runsConceded,
                    wickets: bStats.wickets,
                };
            }
        }
        
        processInnings(match.innings?.innings1);
        processInnings(match.innings?.innings2);

        return {
            matchId: match.id,
            matchName: match.name,
            matchDate: new Date(match.date).toLocaleDateString(),
            result,
            resultDescription: match.resultDescription || 'Result not available',
            batting,
            bowling,
        };
      })
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  }, [player, matches]);
  
  const handleDownloadPDF = () => {
    if (!player || !playerStats) return;

    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(`${player.fullName}'s Report`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    let startY = 40;
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Personal Information', 14, startY);
    startY += 8;
    (doc as any).autoTable({
        startY,
        body: [
            ['Email', player.email],
            ['DOB', new Date(player.dob).toLocaleDateString()],
            ['Role', player.role],
            ['Jersey #', player.jerseyNumber || 'N/A'],
        ],
        theme: 'plain',
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text('Career Statistics', 14, startY);
    startY += 8;
    (doc as any).autoTable({
        startY,
        head: [['Stat', 'Value']],
        body: [
            ['Matches Played', playerStats.matchesPlayed],
            ['Runs Scored', playerStats.totalRuns],
            ['Balls Faced', playerStats.totalBallsFaced],
            ['Wickets Taken', playerStats.totalWickets],
            ['Overs Bowled', formatOvers(playerStats.totalBallsBowled)],
            ['Matches Won', playerStats.matchesWon],
        ],
        headStyles: { fillColor: [249, 115, 22] } // Orange
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text('Match-by-Match Performance', 14, startY);
    startY += 8;
    (doc as any).autoTable({
        startY,
        head: [['Date', 'Match', 'Result', 'Batting', 'Bowling']],
        body: playerMatchStats.map(stat => [
            stat.matchDate,
            stat.matchName,
            stat.result,
            stat.batting ? `${stat.batting.runs} (${stat.batting.balls})` : 'DNB',
            stat.bowling ? `${stat.bowling.wickets}/${stat.bowling.runsConceded} (${stat.bowling.overs})` : 'DNB',
        ]),
        headStyles: { fillColor: [239, 68, 68] } // Red
    });

    doc.save(`${player.fullName.replace(/ /g, '_')}_stats.pdf`);
  };
  
  const handleDownloadExcel = () => {
      if (!player || !playerStats) return;
      const wb = XLSX.utils.book_new();

      const personalInfo = [
          ['Player Report for', player.fullName],
          ['Generated on', new Date().toLocaleDateString()],
          [],
          ['Personal Information'],
          ['Email', player.email],
          ['DOB', new Date(player.dob).toLocaleDateString()],
          ['Role', player.role],
          ['Jersey #', player.jerseyNumber || 'N/A'],
      ];
      const ws_info = XLSX.utils.aoa_to_sheet(personalInfo);
      XLSX.utils.book_append_sheet(wb, ws_info, 'Info');
      
      const careerStats = [
          { Stat: 'Matches Played', Value: playerStats.matchesPlayed },
          { Stat: 'Runs Scored', Value: playerStats.totalRuns },
          { Stat: 'Balls Faced', Value: playerStats.totalBallsFaced },
          { Stat: 'Wickets Taken', Value: playerStats.totalWickets },
          { Stat: 'Overs Bowled', Value: formatOvers(playerStats.totalBallsBowled) },
          { Stat: 'Matches Won', Value: playerStats.matchesWon },
      ];
      const ws_career = XLSX.utils.json_to_sheet(careerStats);
      XLSX.utils.book_append_sheet(wb, ws_career, 'Career Stats');

      const matchData = playerMatchStats.map(stat => ({
          Date: stat.matchDate,
          Match: stat.matchName,
          Result: stat.result,
          'Batting Runs': stat.batting ? stat.batting.runs : 'DNB',
          'Batting Balls': stat.batting ? stat.batting.balls : 'DNB',
          'Bowling Wickets': stat.bowling ? stat.bowling.wickets : 'DNB',
          'Bowling Runs': stat.bowling ? stat.bowling.runsConceded : 'DNB',
          'Bowling Overs': stat.bowling ? stat.bowling.overs : 'DNB',
      }));
      const ws_matches = XLSX.utils.json_to_sheet(matchData);
      XLSX.utils.book_append_sheet(wb, ws_matches, 'Match History');

      XLSX.writeFile(wb, `${player.fullName.replace(/ /g, '_')}_stats.xlsx`);
  };


  if (!player) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 overflow-y-auto">
          <div className="flex items-center space-x-6 mb-6">
            <img src={player.photoUrl} alt={player.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-orange-500" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{player.fullName} {player.jerseyNumber && `(#${player.jerseyNumber})`}</h2>
                <PlayerRoleIcon role={player.role} />
              </div>
              <p className="text-orange-500 dark:text-orange-400">{player.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-300">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Date of Birth</span>
              <span className="text-lg">{new Date(player.dob).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Gender</span>
              <span className="text-lg">{player.gender}</span>
            </div>
             <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Role</span>
              <span className="text-lg">{player.role}</span>
            </div>
             <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Jersey Number</span>
              <span className="text-lg">{player.jerseyNumber || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">State</span>
              <span className="text-lg">{player.state}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Country</span>
              <span className="text-lg">{player.country}</span>
            </div>
            <div className="flex flex-col md:col-span-2">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Registration Date</span>
              <span className="text-lg">{new Date(player.registrationDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          {playerStats && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Career Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatItem label="Matches Played" value={playerStats.matchesPlayed} />
                <StatItem label="Runs Scored" value={playerStats.totalRuns} />
                <StatItem label="Balls Faced" value={playerStats.totalBallsFaced} />
                <StatItem label="Wickets Taken" value={playerStats.totalWickets} />
                <StatItem label="Overs Bowled" value={formatOvers(playerStats.totalBallsBowled)} />
                <StatItem label="Matches Won" value={playerStats.matchesWon} />
              </div>
            </div>
          )}

          {playerMatchStats && playerMatchStats.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Match-by-Match Performance</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {playerMatchStats.map((stat) => {
                  const isExpanded = expandedMatchId === stat.matchId;
                  const resultColorClass = stat.result === 'Win' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                                  : stat.result === 'Loss' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                                  : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
                  
                  return (
                    <div key={stat.matchId} className="bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden transition-all">
                      <button 
                        className="w-full p-3 text-left flex justify-between items-center hover:bg-slate-200 dark:hover:bg-slate-700"
                        onClick={() => setExpandedMatchId(isExpanded ? null : stat.matchId)}
                      >
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{stat.matchName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{stat.matchDate}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${resultColorClass}`}>
                            {stat.result}
                          </span>
                           <ChevronDownIcon className={`h-5 w-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 animate-in fade-in-0">
                           <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold mb-3">{stat.resultDescription}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Batting</h4>
                              {stat.batting ? (
                                 <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                                   <p><strong>Runs:</strong> {stat.batting.runs} ({stat.batting.balls} balls)</p>
                                   <p><strong>4s:</strong> {stat.batting.fours}</p>
                                   <p><strong>6s:</strong> {stat.batting.sixes}</p>
                                   <p><strong>Status:</strong> {stat.batting.isOut ? 'Out' : 'Not Out'}</p>
                                 </div>
                              ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Did not bat.</p>
                              )}
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Bowling</h4>
                               {stat.bowling ? (
                                 <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                                   <p><strong>Overs:</strong> {stat.bowling.overs}</p>
                                   <p><strong>Runs:</strong> {stat.bowling.runsConceded}</p>
                                   <p><strong>Wickets:</strong> {stat.bowling.wickets}</p>
                                 </div>
                               ) : (
                                 <p className="text-sm text-slate-500 dark:text-slate-400">Did not bowl.</p>
                               )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="relative">
              <button
                onClick={() => setIsDownloadOpen(prev => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                <FileDownloadIcon />
                Download Report
              </button>
              {isDownloadOpen && (
                 <div className="absolute bottom-full mb-2 w-full bg-slate-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2">
                    <button onClick={()=>{ handleDownloadPDF(); setIsDownloadOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors text-white">
                        <PdfIcon className="text-rose-400" />
                        <span>Download as PDF</span>
                    </button>
                    <button onClick={()=>{ handleDownloadExcel(); setIsDownloadOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors text-white">
                        <ExcelIcon className="text-emerald-400" />
                        <span>Download as Excel</span>
                    </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};