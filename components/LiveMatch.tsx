import React, { useState, useMemo, useEffect } from 'react';
import { Match, Player, PlayerRole, Innings, BatsmanStats, BowlOutAttempt, TieBreaker, LiveMatchStage, LiveState, LiveMatchProgress } from '../types';
import { BatIcon, BowlingIcon, AllRounderIcon, FileDownloadIcon, PdfIcon, ExcelIcon, TrophyIcon, XIcon, UndoIcon, SpeedGunIcon } from './Icons';
import { MATCH_FEE_PER_PLAYER } from '../constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface LiveMatchProps {
  match: Match;
  players: Player[];
  onUpdateMatch: (updatedMatch: Match) => void;
  onExit: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const formatOvers = (balls: number) => {
    if (balls < 0) balls = 0;
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
};

const getInitialInningsState = (playerIds: string[], battingTeam: string, bowlingTeam: string): Innings => {
    const batsmenStats: Innings['batsmenStats'] = {};
    const bowlerStats: Innings['bowlerStats'] = {};
    playerIds.forEach(pId => {
        batsmenStats[pId] = { runs: 0, balls: 0, isOut: false, fours: 0, sixes: 0 };
        bowlerStats[pId] = { ballsBowled: 0, runsConceded: 0, wickets: 0 };
    });
    return {
        battingTeam, bowlingTeam, score: 0, wickets: 0, totalLegalBalls: 0,
        batsmenStats, bowlerStats, fallOfWickets: []
    };
};

const PlayerRoleIcon: React.FC<{ role: PlayerRole; className?: string }> = ({ role, className = "h-4 w-4 text-slate-400" }) => {
    switch (role) {
        case PlayerRole.Batter: return <BatIcon className={className} />;
        case PlayerRole.Bowler: return <BowlingIcon className={className} />;
        case PlayerRole.AllRounder: return <AllRounderIcon className={className} />;
        default: return null;
    }
};

const PlayerSelectionCard: React.FC<{ title: string; players: Player[]; selected: string[]; onSelect: (id: string) => void; limit: number; }> = 
({ title, players, selected, onSelect, limit }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg flex flex-col">
        <h3 className="text-lg font-bold text-white mb-3 flex-shrink-0">{title} ({selected.length}/{limit})</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {players.map(p => (
                <button
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors ${selected.includes(p.id) ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                    <img src={p.photoUrl} alt={p.fullName} className="h-8 w-8 rounded-full object-cover" />
                    <div className="flex items-center gap-2">
                      <span>{p.fullName}</span>
                      <PlayerRoleIcon role={p.role} />
                    </div>
                </button>
            ))}
        </div>
    </div>
);

const SelectionModal: React.FC<{ title: string; players: Player[]; onSelect: (playerId: string) => void; onCancel?: () => void;}> = ({ title, players, onSelect, onCancel }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-6 text-white animate-in fade-in-0 zoom-in-95">
        <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {players.length > 0 ? players.map(p => (
                 <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors ${selectedPlayerId === p.id ? 'bg-gradient-to-r from-orange-500 to-red-600 ring-2 ring-orange-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                    <img src={p.photoUrl} alt={p.fullName} className="h-10 w-10 rounded-full object-cover" />
                    <div><span className="font-semibold">{p.fullName}</span><br/><span className="text-sm text-slate-400">{p.role}</span></div>
                </button>
            )) : <p className="text-center text-slate-400 p-4">No players available.</p>}
        </div>
        <div className="mt-6 flex items-center gap-4">
            {onCancel && <button onClick={onCancel} className="w-full p-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-500 transition-colors">Cancel</button>}
            <button onClick={() => selectedPlayerId && onSelect(selectedPlayerId)} disabled={!selectedPlayerId} className="w-full p-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-slate-500 disabled:cursor-not-allowed">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const WicketTakerModal: React.FC<{
  step: 'type' | 'catcher' | 'runout_batsman' | 'runout_fielder';
  onClose: () => void;
  bowlingTeamPlayers: Player[];
  onDismissalSelect: (type: 'Bowled' | 'Caught' | 'LBW' | 'Run Out') => void;
  onFielderSelect: (fielderId: string, dismissalType: 'Caught' | 'Run Out') => void;
  isFreeHit: boolean;
  onStrikeBatsman?: Player;
  offStrikeBatsman?: Player;
  onBatsmanOutSelect: (batsmanId: string) => void;
}> = ({ step, onClose, bowlingTeamPlayers, onDismissalSelect, onFielderSelect, isFreeHit, onStrikeBatsman, offStrikeBatsman, onBatsmanOutSelect }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-6 text-white animate-in fade-in-0 zoom-in-95">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white">&times;</button>
        {step === 'type' && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6">How was the wicket taken?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onDismissalSelect('Bowled')} disabled={isFreeHit} className="p-3 bg-rose-600 rounded-lg font-semibold hover:bg-rose-700 disabled:bg-slate-500 disabled:cursor-not-allowed">Bowled</button>
              <button onClick={() => onDismissalSelect('Caught')} disabled={isFreeHit} className="p-3 bg-sky-600 rounded-lg font-semibold hover:bg-sky-700 disabled:bg-slate-500 disabled:cursor-not-allowed">Caught</button>
              <button onClick={() => onDismissalSelect('LBW')} disabled={isFreeHit} className="p-3 bg-amber-600 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-slate-500 disabled:cursor-not-allowed">LBW</button>
              <button onClick={() => onDismissalSelect('Run Out')} className="p-3 bg-teal-600 rounded-lg font-semibold hover:bg-teal-700">Run Out</button>
            </div>
          </div>
        )}
        {step === 'runout_batsman' && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-4">Which batsman was out?</h2>
            <div className="space-y-3">
              {onStrikeBatsman && <button onClick={() => onBatsmanOutSelect(onStrikeBatsman.id)} className="w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors bg-slate-700 hover:bg-slate-600"><img src={onStrikeBatsman.photoUrl} alt={onStrikeBatsman.fullName} className="h-10 w-10 rounded-full object-cover" /> {onStrikeBatsman.fullName} (Striker)</button>}
              {offStrikeBatsman && <button onClick={() => onBatsmanOutSelect(offStrikeBatsman.id)} className="w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors bg-slate-700 hover:bg-slate-600"><img src={offStrikeBatsman.photoUrl} alt={offStrikeBatsman.fullName} className="h-10 w-10 rounded-full object-cover" /> {offStrikeBatsman.fullName} (Non-striker)</button>}
            </div>
          </div>
        )}
        {(step === 'catcher' || step === 'runout_fielder') && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-4">Who was the fielder?</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {bowlingTeamPlayers.map(p => (
                <button key={p.id} onClick={() => onFielderSelect(p.id, step === 'catcher' ? 'Caught' : 'Run Out')} className="w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors bg-slate-700 hover:bg-slate-600">
                  <img src={p.photoUrl} alt={p.fullName} className="h-10 w-10 rounded-full object-cover" />
                  <div><span className="font-semibold">{p.fullName}</span><br /><span className="text-sm text-slate-400">{p.role}</span></div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RunOutResolutionModal: React.FC<{
  availableBatsmen: Player[];
  onResolve: (newBatsmanId: string) => void;
  onClose: () => void;
}> = ({ availableBatsmen, onResolve, onClose }) => {
  return (
    <SelectionModal
      title="Select New Batsman"
      players={availableBatsmen}
      onSelect={onResolve}
      onCancel={onClose}
    />
  );
};

const calculateManOfTheMatch = (match: Match, players: Player[]): string | null => {
    if (match.status !== 'Completed' || (!match.innings && !match.tieBreakers?.length)) {
        return null;
    }

    const playerScores: { [key: string]: number } = {};
    match.players.forEach(pId => { playerScores[pId] = 0; });

    // Process main innings first
    if (match.innings) {
        const inningsToConsider: Innings[] = [];
        if (match.innings.innings1) inningsToConsider.push(match.innings.innings1);
        if (match.innings.innings2) inningsToConsider.push(match.innings.innings2);

        inningsToConsider.forEach(inn => {
            Object.entries(inn.batsmenStats).forEach(([pId, stats]) => {
                playerScores[pId] = playerScores[pId] || 0;
                playerScores[pId] += (stats.runs || 0) * 1.5;
                if ((stats.balls || 0) > 0) {
                    const strikeRate = ((stats.runs || 0) / (stats.balls || 1)) * 100;
                    if (strikeRate > 120) playerScores[pId] += (strikeRate - 120) * 0.5;
                }
                if ((stats.runs || 0) >= 100) playerScores[pId] += 50;
                else if ((stats.runs || 0) >= 50) playerScores[pId] += 25;
            });

            Object.entries(inn.bowlerStats).forEach(([pId, stats]) => {
                playerScores[pId] = playerScores[pId] || 0;
                playerScores[pId] += (stats.wickets || 0) * 25;
                if ((stats.wickets || 0) >= 5) playerScores[pId] += 50;
                else if ((stats.wickets || 0) >= 3) playerScores[pId] += 25;

                if ((stats.ballsBowled || 0) >= 12) {
                    const economy = ((stats.runsConceded || 0) / ((stats.ballsBowled || 1) / 6));
                    if (economy < 8) {
                        playerScores[pId] += (8 - economy) * 10;
                    }
                }
            });

            Object.values(inn.batsmenStats).forEach(batsmanStat => {
                if ((batsmanStat.howOut === 'Caught' || batsmanStat.howOut === 'Run Out') && batsmanStat.fielderId) {
                    playerScores[batsmanStat.fielderId] = playerScores[batsmanStat.fielderId] || 0;
                    playerScores[batsmanStat.fielderId] += 10;
                }
            });
        });
    }

    const lastTieBreaker = match.tieBreakers && match.tieBreakers.length > 0
        ? match.tieBreakers[match.tieBreakers.length - 1]
        : null;
    
    // Process tie-breaker innings and add bonus points
    if (lastTieBreaker && lastTieBreaker.resultDescription) {
        if (lastTieBreaker.type === 'Super Over' && lastTieBreaker.superOver) {
            const soInnings = [lastTieBreaker.superOver.innings1, lastTieBreaker.superOver.innings2].filter((i): i is Innings => !!i);
            
            soInnings.forEach(inn => {
                Object.entries(inn.batsmenStats).forEach(([pId, stats]) => {
                    playerScores[pId] = playerScores[pId] || 0;
                    playerScores[pId] += (stats.runs || 0) * 5; // Extra points for super over runs
                    if ((stats.runs || 0) >= 10) playerScores[pId] += 20; // Bonus for high score in SO
                    playerScores[pId] += (stats.sixes || 0) * 10; // Bonus for sixes in SO
                });
                Object.entries(inn.bowlerStats).forEach(([pId, stats]) => {
                    playerScores[pId] = playerScores[pId] || 0;
                    playerScores[pId] += (stats.wickets || 0) * 50; // High value for SO wickets
                    if (stats.ballsBowled > 0) {
                        if (stats.runsConceded <= 6) playerScores[pId] += 30; // Bonus for economical SO
                        else if (stats.runsConceded <= 10) playerScores[pId] += 15;
                    }
                });
            });
        } else if (lastTieBreaker.type === 'Bowl Out' && lastTieBreaker.bowlOutResult) {
            lastTieBreaker.bowlOutResult.forEach(attempt => {
                if (attempt.outcome === 'Hit') {
                    playerScores[attempt.bowlerId] = playerScores[attempt.bowlerId] || 0;
                    playerScores[attempt.bowlerId] += 50; // Bonus for bowl out hit
                }
            });
        }
    }

    if (match.winner) {
        const winningTeamPlayers = match.teams[match.winner];
        if (winningTeamPlayers) {
            winningTeamPlayers.forEach(pId => {
                if (playerScores[pId] !== undefined) {
                    playerScores[pId] += 20;
                }
            });
        }
    }

    let motmPlayerId: string | null = null;
    let maxScore = -1;

    for (const pId in playerScores) {
        if (playerScores[pId] > maxScore) {
            maxScore = playerScores[pId];
            motmPlayerId = pId;
        }
    }

    return maxScore > 0 ? motmPlayerId : null;
};

const StageWrapper: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`w-full max-w-4xl bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-6 text-white animate-in fade-in-0 zoom-in-95 overflow-y-auto max-h-[95vh] ${className}`}>
        {children}
    </div>
);

const ScorecardDisplay: React.FC<{ match: Match; players: Player[]; onExit: () => void }> = ({ match, players, onExit }) => {
    const { innings, teams, winner, resultDescription, manOfTheMatchId } = match;
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    
    const getPlayerName = (id: string) => players.find(p => p.id === id)?.fullName || 'Unknown';
    const calcSR = (r: number, b: number) => b > 0 ? ((r / b) * 100).toFixed(2) : '0.00';
    const calcEcon = (r: number, b: number) => b > 0 ? ((r / (b/6))).toFixed(2) : '0.00';

    const getDismissalString = (batsmanStats: BatsmanStats): string => {
        if (!batsmanStats.isOut) return 'not out';
        
        const bowlerName = getPlayerName(batsmanStats.bowlerId || '');

        switch (batsmanStats.howOut) {
            case 'Bowled':
                return `b. ${bowlerName}`;
            case 'Caught':
                const fielderName = getPlayerName(batsmanStats.fielderId || '');
                return `c. ${fielderName} b. ${bowlerName}`;
            case 'LBW':
                return `lbw b. ${bowlerName}`;
            case 'Run Out':
                 const runOutFielder = getPlayerName(batsmanStats.fielderId || '');
                 return `run out (${runOutFielder})`;
            default:
                return 'out';
        }
    };
    
    const addInningsToPdf = (doc: jsPDF, inn: Innings, startY: number, titlePrefix: string = '') => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${titlePrefix}${inn.battingTeam} Innings: ${inn.score}/${inn.wickets} (${formatOvers(inn.totalLegalBalls)} Overs)`, 14, startY);
        startY += 10;
        
        const battingHead = [['Batsman', 'Status', 'R', 'B', '4s', '6s', 'S/R']];
        const battingBody = teams[inn.battingTeam].map(pId => {
            const stats = inn.batsmenStats[pId];
            if (!stats || (stats.balls === 0 && !stats.isOut)) return null;
            return [ getPlayerName(pId), getDismissalString(stats), stats.runs, stats.balls, stats.fours, stats.sixes, calcSR(stats.runs, stats.balls) ];
        }).filter(Boolean) as (string|number)[][];

        (doc as any).autoTable({ head: battingHead, body: battingBody, startY: startY, theme: 'striped', headStyles: { fillColor: [249, 115, 22] } }); // Orange
        startY = (doc as any).lastAutoTable.finalY + 10;
        
        const bowlingHead = [['Bowler', 'O', 'R', 'W', 'Econ.']];
        const bowlingBody = teams[inn.bowlingTeam].map(pId => {
            const stats = inn.bowlerStats[pId];
            if (!stats || stats.ballsBowled === 0) return null;
            return [ getPlayerName(pId), formatOvers(stats.ballsBowled), stats.runsConceded, stats.wickets, calcEcon(stats.runsConceded, stats.ballsBowled) ];
        }).filter(Boolean) as (string|number)[][];

        (doc as any).autoTable({ head: bowlingHead, body: bowlingBody, startY: startY, theme: 'striped', headStyles: { fillColor: [239, 68, 68] } }); // Red
        return (doc as any).lastAutoTable.finalY + 15;
    };


    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(249, 115, 22); // Orange
        doc.text('SCORE CARD By BCC PUNE', 14, 15);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(match.name, 14, 25);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(resultDescription || `Winner: ${winner}`, 14, 33);
        
        let startY = 45;
        if (manOfTheMatchId) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(`Man of the Match: ${getPlayerName(manOfTheMatchId)}`, 14, 40);
            startY = 50;
        }

        if (match.fastestBall) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(`Fastest Ball: ${getPlayerName(match.fastestBall.bowlerId)} (${match.fastestBall.speed.toFixed(1)} km/h)`, 14, startY);
            startY += 10;
        }

        if (innings?.innings1) { startY = addInningsToPdf(doc, innings.innings1, startY); }
        if (innings?.innings2) { doc.addPage(); startY = 20; startY = addInningsToPdf(doc, innings.innings2, startY); }

        (match.tieBreakers || []).forEach((tb, index) => {
            if (tb.type === 'Super Over' && tb.superOver) {
                if (tb.superOver.innings1) {
                    if (startY > 250) { doc.addPage(); startY = 20; }
                    startY = addInningsToPdf(doc, tb.superOver.innings1, startY, `Super Over ${index + 1}: `);
                }
                if (tb.superOver.innings2) {
                    if (startY > 250) { doc.addPage(); startY = 20; }
                    startY = addInningsToPdf(doc, tb.superOver.innings2, startY, `Super Over ${index + 1}: `);
                }
            }
            if (tb.type === 'Bowl Out' && tb.bowlOutResult) {
                doc.addPage(); startY = 20;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Bowl Out ${index + 1} Results`, 14, startY);
                startY += 10;
                const bowlOutBody = tb.bowlOutResult.map(attempt => [attempt.teamName, getPlayerName(attempt.bowlerId), attempt.outcome]);
                (doc as any).autoTable({
                    head: [['Team', 'Bowler', 'Outcome']],
                    body: bowlOutBody,
                    startY: startY,
                    theme: 'striped',
                    headStyles: { fillColor: [192, 57, 43] }
                });
            }
        });
        
        const dataUri = doc.output('dataurlstring');
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `${match.name.replace(/ /g, '_')}_scorecard.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const addInningsToSheet = (wb: XLSX.WorkBook, inn: Innings, sheetNamePrefix: string = '') => {
        const sheetName = `${sheetNamePrefix}${inn.battingTeam.substring(0, 20)} Innings`;
        const battingData = teams[inn.battingTeam].map(pId => { const s = inn.batsmenStats[pId]; if (!s || (s.balls === 0 && !s.isOut)) return null; return {'Batsman': getPlayerName(pId), 'Status': getDismissalString(s), 'Runs': s.runs, 'Balls': s.balls, '4s': s.fours, '6s': s.sixes, 'SR': calcSR(s.runs, s.balls) }; }).filter(Boolean);
        const bowlingData = teams[inn.bowlingTeam].map(pId => { const s = inn.bowlerStats[pId]; if(!s || s.ballsBowled === 0) return null; return {'Bowler': getPlayerName(pId), 'Overs': formatOvers(s.ballsBowled), 'Runs Conceded': s.runsConceded, 'Wickets': s.wickets, 'Econ': calcEcon(s.runsConceded, s.ballsBowled) }; }).filter(Boolean);
        
        const ws = XLSX.utils.json_to_sheet(battingData as any[], {header: ['Batsman', 'Status', 'Runs', 'Balls', '4s', '6s', 'SR']});
        XLSX.utils.sheet_add_aoa(ws, [[' ']], {origin: -1});
        XLSX.utils.sheet_add_json(ws, bowlingData as any[], {origin: -1, skipHeader: false});
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new();
        
        const summaryData = [
            ['Match', match.name],
            ['Result', resultDescription || `Winner: ${winner}`],
        ];
        if (manOfTheMatchId) {
            summaryData.push(['Man of the Match', getPlayerName(manOfTheMatchId)]);
        }
        if (match.fastestBall) {
            summaryData.push(['Fastest Ball', `${getPlayerName(match.fastestBall.bowlerId)} (${match.fastestBall.speed.toFixed(1)} km/h)`]);
        }
        const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws_summary, 'Summary');

        if (innings?.innings1) addInningsToSheet(wb, innings.innings1);
        if (innings?.innings2) addInningsToSheet(wb, innings.innings2);
        
        (match.tieBreakers || []).forEach((tb, index) => {
            if (tb.type === 'Super Over' && tb.superOver) {
                if (tb.superOver.innings1) addInningsToSheet(wb, tb.superOver.innings1, `SO${index + 1} `);
                if (tb.superOver.innings2) addInningsToSheet(wb, tb.superOver.innings2, `SO${index + 1} `);
            }
            if (tb.type === 'Bowl Out' && tb.bowlOutResult) {
                const bowlOutData = tb.bowlOutResult.map(attempt => ({ Team: attempt.teamName, Bowler: getPlayerName(attempt.bowlerId), Outcome: attempt.outcome }));
                const ws = XLSX.utils.json_to_sheet(bowlOutData);
                XLSX.utils.book_append_sheet(wb, ws, `Bowl Out ${index + 1}`);
            }
        });

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `${match.name.replace(/ /g, '_')}_scorecard.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const InningsCard: React.FC<{ innings: Innings, titlePrefix?: string }> = ({ innings, titlePrefix = '' }) => (
        <div className="bg-slate-800/80 p-4 rounded-xl space-y-4">
            <header className="border-b-2 border-slate-700 pb-2 mb-2">
                <h3 className="text-xl font-bold text-white">{titlePrefix}{innings.battingTeam}</h3>
                <p className="text-2xl font-bold text-amber-400">{innings.score}/{innings.wickets} <span className="text-lg text-slate-400">({formatOvers(innings.totalLegalBalls)} ov)</span></p>
            </header>
            
            <div className="text-sm">
                <table className="w-full text-left">
                    <thead><tr className="text-slate-400"><th className="p-1 font-semibold">Batsman</th><th className="p-1 text-center">R</th><th className="p-1 text-center">B</th><th className="p-1 text-center">4s</th><th className="p-1 text-center">6s</th><th className="p-1 text-center">S/R</th></tr></thead>
                    <tbody>{teams[innings.battingTeam].map(pId => { const stats = innings.batsmenStats[pId]; if(!stats || (stats.runs === 0 && stats.balls === 0 && !stats.isOut)) return null; return (<tr key={pId} className="border-t border-slate-700/50"><td className="p-1.5"><span className="font-semibold">{getPlayerName(pId)}</span><span className={`block text-xs ${stats.isOut ? 'text-rose-400' : 'text-emerald-400'}`}>{getDismissalString(stats)}</span></td><td className="p-1.5 text-center font-mono">{stats.runs}</td><td className="p-1.5 text-center font-mono">{stats.balls}</td><td className="p-1.5 text-center font-mono">{stats.fours}</td><td className="p-1.5 text-center font-mono">{stats.sixes}</td><td className="p-1.5 text-center font-mono">{calcSR(stats.runs, stats.balls)}</td></tr>)})}</tbody>
                </table>
            </div>

            <div className="text-sm"><table className="w-full text-left"><thead className="border-t-2 border-slate-700 pt-2"><tr className="text-slate-400"><th className="p-1 pt-3 font-semibold">Bowler</th><th className="p-1 pt-3 text-center">O</th><th className="p-1 pt-3 text-center">R</th><th className="p-1 pt-3 text-center">W</th><th className="p-1 pt-3 text-center">Econ.</th></tr></thead><tbody>{teams[innings.bowlingTeam].map(pId => { const stats = innings.bowlerStats[pId]; if(!stats || stats.ballsBowled === 0) return null; return (<tr key={pId} className="border-t border-slate-700/50"><td className="p-1.5 font-semibold">{getPlayerName(pId)}</td><td className="p-1.5 text-center font-mono">{formatOvers(stats.ballsBowled)}</td><td className="p-1.5 text-center font-mono">{stats.runsConceded}</td><td className="p-1.5 text-center font-mono">{stats.wickets}</td><td className="p-1.5 text-center font-mono">{calcEcon(stats.runsConceded, stats.ballsBowled)}</td></tr>)})}</tbody></table></div>

            {innings.fallOfWickets.length > 0 && <div className="text-sm pt-2 border-t-2 border-slate-700"><h4 className="font-semibold text-slate-300 mb-1">Fall of Wickets</h4><p className="text-slate-400 font-mono text-xs">{innings.fallOfWickets.map(fow => `${fow.score}-${fow.wicket} (${getPlayerName(fow.batsmanId)})`).join(', ')}</p></div>}
        </div>
    );
    
     const BowlOutDisplay: React.FC<{ bowlOutResult: BowlOutAttempt[], title: string }> = ({ bowlOutResult, title }) => {
        const teamNames = Object.keys(match.teams);
        const teamAHits = bowlOutResult.filter(a => a.teamName === teamNames[0] && a.outcome === 'Hit').length;
        const teamBHits = bowlOutResult.filter(a => a.teamName === teamNames[1] && a.outcome === 'Hit').length;

        return (
            <div className="bg-slate-800/80 p-4 rounded-xl space-y-4 md:col-span-2">
                <header className="border-b-2 border-slate-700 pb-2 mb-2"><h3 className="text-xl font-bold text-white">{title}</h3></header>
                <div className="flex justify-around text-center text-lg font-bold"><span>{teamNames[0]}: {teamAHits} Hits</span><span>{teamNames[1]}: {teamBHits} Hits</span></div>
                <div className="text-sm"><table className="w-full text-left"><thead><tr className="text-slate-400"><th className="p-1 font-semibold">Team</th><th className="p-1 font-semibold">Bowler</th><th className="p-1 text-center">Outcome</th></tr></thead><tbody>
                    {bowlOutResult.map((attempt, index) => (<tr key={index} className="border-t border-slate-700/50"><td className="p-1.5">{attempt.teamName}</td><td className="p-1.5">{getPlayerName(attempt.bowlerId)}</td><td className={`p-1.5 text-center font-semibold ${attempt.outcome === 'Hit' ? 'text-emerald-400' : 'text-rose-400'}`}>{attempt.outcome}</td></tr>))}
                </tbody></table></div>
            </div>
        );
     };

    return (
        <>
            <header className="text-center mb-6">
              <h1 className="text-3xl font-bold">{match.name}</h1>
              <h2 className="text-2xl font-bold text-amber-400 mt-1">{resultDescription || `Winner: ${winner}`}</h2>
              {manOfTheMatchId && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-lg text-yellow-300">
                      <TrophyIcon className="h-6 w-6 text-yellow-300" />
                      <span>Man of the Match: <strong>{getPlayerName(manOfTheMatchId)}</strong></span>
                  </div>
              )}
              {match.fastestBall && (
                <div className="mt-2 flex items-center justify-center gap-2 text-lg text-cyan-400">
                    <SpeedGunIcon />
                    <span>Fastest Ball: <strong>{getPlayerName(match.fastestBall.bowlerId)}</strong> - {match.fastestBall.speed.toFixed(1)} km/h</span>
                </div>
              )}
              <p className="text-sm text-slate-400 mt-2">Toss won by {match.tossWinner}, who chose to {match.decision}.</p>
            </header>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {/* Main Innings */}
                {innings?.innings1 && <InningsCard innings={innings.innings1} />}
                {innings?.innings2 && <InningsCard innings={innings.innings2} />}
                
                {/* Tie Breakers */}
                {(match.tieBreakers || []).map((tb, index) => {
                    if (tb.type === 'Super Over' && tb.superOver) {
                        return (
                            <React.Fragment key={`so-${index}`}>
                                {tb.superOver.innings1 && <InningsCard innings={tb.superOver.innings1} titlePrefix={`Super Over ${index + 1}: `} />}
                                {tb.superOver.innings2 && <InningsCard innings={tb.superOver.innings2} titlePrefix={`Super Over ${index + 1}: `} />}
                            </React.Fragment>
                        );
                    }
                    if (tb.type === 'Bowl Out' && tb.bowlOutResult) {
                        return (
                            <BowlOutDisplay key={`bo-${index}`} bowlOutResult={tb.bowlOutResult} title={`Bowl Out ${index + 1} Results`} />
                        );
                    }
                    return null;
                })}
            </div>

             <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <div className="relative">
                    <button onClick={() => setIsDownloadOpen(prev => !prev)} className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-transform hover:scale-105"><FileDownloadIcon /><span>Download Scorecard</span></button>
                    {isDownloadOpen && <div className="absolute bottom-full mb-2 w-full bg-slate-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2">
                        <button onClick={()=>{ handleDownloadPDF(); setIsDownloadOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-600 transition-colors"><PdfIcon className="text-rose-400" /><span>Download as PDF</span></button>
                        <button onClick={()=>{ handleDownloadExcel(); setIsDownloadOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-600 transition-colors"><ExcelIcon className="text-emerald-400" /><span>Download as Excel</span></button>
                    </div>}
                </div>
                <button onClick={onExit} className="px-6 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-500 transition-transform hover:scale-105">Exit</button>
            </div>
        </>
    );
};

export const LiveMatch: React.FC<LiveMatchProps> = ({ match, players, onUpdateMatch, onExit, onShowToast }) => {
  const matchPlayers = useMemo(() => players.filter(p => match.players.includes(p.id)), [players, match.players]);

  const getInitialIsSuperOver = () => {
    if (!match.tieBreakers || match.tieBreakers.length === 0) return false;
    const lastTieBreaker = match.tieBreakers[match.tieBreakers.length - 1];
    return lastTieBreaker.type === 'Super Over' && !lastTieBreaker.resultDescription;
  };

  const [stage, setStage] = useState<LiveMatchStage>(match.liveProgress?.stage || (match.decision ? (match.status === 'Completed' ? 'matchOver' : 'play') : 'toss'));
  const [tossWinner, setTossWinner] = useState<string | null>(match.tossWinner || null);
  
  const [tieBreakers, setTieBreakers] = useState<TieBreaker[]>(match.tieBreakers || []);
  const [isSuperOver, setIsSuperOver] = useState(getInitialIsSuperOver);
  const [tiedMatchInnings, setTiedMatchInnings] = useState<typeof match.innings | null>(isSuperOver || match.status !== 'Live' ? match.innings : null);
  const [completedMatchData, setCompletedMatchData] = useState<Match | null>(match.status === 'Completed' ? match : null);

  const [currentInningsNum, setCurrentInningsNum] = useState<1 | 2>(match.liveProgress?.currentInningsNum || (match.innings?.innings2 ? 2 : 1));
  const [innings, setInnings] = useState(() => match.liveProgress?.innings || ({
      innings1: match.innings?.innings1 || getInitialInningsState(match.players, '', ''),
      innings2: match.innings?.innings2 || getInitialInningsState(match.players, '', '')
  }));
  
  const [liveState, setLiveState] = useState<LiveState>(match.liveProgress?.liveState || ({ onStrikeBatsmanId: '', offStrikeBatsmanId: '', currentBowlerId: '', previousBowlerId: '', currentOverEvents: [] as string[], target: 0, isFreeHit: false }));
  const [overHistory, setOverHistory] = useState<{ innings: typeof innings, liveState: LiveState, fastestBall: typeof fastestBall }[]>([]);

  const [extraEventInfo, setExtraEventInfo] = useState<{ type: 'Wd' | 'Nb' | null }>({ type: null });
  const [wicketTakerInfo, setWicketTakerInfo] = useState<{ step: 'type' | 'catcher' | 'runout_batsman' | 'runout_fielder' | null, batsmanOutId?: string }>({ step: null });
  
  const [isShortRunModalOpen, setIsShortRunModalOpen] = useState(false);
  const [runOutRunsSelection, setRunOutRunsSelection] = useState(false);
  const [wicketFlowState, setWicketFlowState] = useState<{ baseEvent: string, runsScored: number, howOut: 'Run Out', fielderId?: string, batsmanOutId?: string, batsmenCrossed?: boolean; } | null>(null);
  const [runOutResolution, setRunOutResolution] = useState(false);
  const [showCrossedModal, setShowCrossedModal] = useState(false);

  const [bowlOutState, setBowlOutState] = useState<{ attempts: BowlOutAttempt[], currentTeam: string, currentTurn: number, teamABowlers: string[], teamBBowlers: string[] }>({ attempts: [], currentTeam: '', currentTurn: 1, teamABowlers: [], teamBBowlers: [] });
  const [showBowlOutBowlerSelection, setShowBowlOutBowlerSelection] = useState(false);

  const [fastestBall, setFastestBall] = useState(match.fastestBall);
  const [currentSpeed, setCurrentSpeed] = useState('');
  const [speedForWicket, setSpeedForWicket] = useState<number | undefined>();

  useEffect(() => {
    if (match.status === 'Live' && stage !== 'matchOver') {
        const currentProgress: LiveMatchProgress = {
            stage,
            currentInningsNum,
            innings,
            liveState,
        };

        if (JSON.stringify(match.liveProgress) !== JSON.stringify(currentProgress) || JSON.stringify(match.fastestBall) !== JSON.stringify(fastestBall)) {
            onUpdateMatch({
                ...match,
                innings: isSuperOver ? match.innings : currentProgress.innings, 
                liveProgress: currentProgress,
                fastestBall,
            });
        }
    }
  }, [stage, currentInningsNum, innings, liveState, match, onUpdateMatch, isSuperOver, fastestBall]);

  const getPlayerName = (id: string | null): string => {
      if (!id) return 'Unknown';
      return matchPlayers.find(p => p.id === id)?.fullName || 'Unknown';
  };

  const teamNames = Object.keys(match.teams);
  const { battingTeamName, bowlingTeamName } = useMemo(() => {
    if (!match.tossWinner || !match.decision) return { battingTeamName: '', bowlingTeamName: '' };

    if (isSuperOver) {
        if (!tiedMatchInnings?.innings1?.battingTeam || !tiedMatchInnings?.innings2?.battingTeam) {
            return { battingTeamName: '', bowlingTeamName: '' };
        }
        const mainMatchSecondBattingTeam = tiedMatchInnings.innings2.battingTeam;
        const mainMatchFirstBattingTeam = tiedMatchInnings.innings1.battingTeam;

        const superOverBattingTeam = currentInningsNum === 1 ? mainMatchSecondBattingTeam : mainMatchFirstBattingTeam;
        const superOverBowlingTeam = currentInningsNum === 1 ? mainMatchFirstBattingTeam : mainMatchSecondBattingTeam;
        return { battingTeamName: superOverBattingTeam, bowlingTeamName: superOverBowlingTeam };
    }
    
    const firstInningsBatting = match.decision === 'Bat' ? match.tossWinner : (teamNames.find(t => t !== match.tossWinner) || '');
    const batting = currentInningsNum === 1 ? firstInningsBatting : (teamNames.find(t => t !== firstInningsBatting) || '');
    const bowling = currentInningsNum === 1 ? (teamNames.find(t => t !== firstInningsBatting) || '') : firstInningsBatting;
    
    return { battingTeamName: batting, bowlingTeamName: bowling };
  }, [match, currentInningsNum, teamNames, isSuperOver, tiedMatchInnings]);


  useEffect(() => {
      const inningsKey = `innings${currentInningsNum}` as 'innings1' | 'innings2';
      const currentInningData = innings[inningsKey];

      if (currentInningData.battingTeam !== battingTeamName && battingTeamName) {
          setInnings(prev => ({
              ...prev,
              [inningsKey]: {
                  ...prev[inningsKey],
                  battingTeam: battingTeamName,
                  bowlingTeam: bowlingTeamName
              }
          }));
      }
  }, [battingTeamName, bowlingTeamName, currentInningsNum, innings, isSuperOver]);
  
  const [openers, setOpeners] = useState<string[]>([]);
  const [bowler, setBowler] = useState<string[]>([]);
  
  const handleToss = () => { setTossWinner(Math.random() < 0.5 ? teamNames[0] : teamNames[1]); setStage('decision'); };
  const handleDecision = (decision: 'Bat' | 'Bowl') => { onUpdateMatch({ ...match, tossWinner, decision }); setStage('openers'); };

  const handlePlayerSelect = (id: string, type: 'batsman' | 'bowler') => {
      if (type === 'batsman') setOpeners(o => o.includes(id) ? o.filter(pId => pId !== id) : o.length < 2 ? [...o, id] : o);
      else setBowler(b => b.includes(id) ? [] : [id]);
  };
  
  const handleStartPlay = () => {
    setLiveState(prev => ({ 
        ...prev, 
        onStrikeBatsmanId: openers[0], 
        offStrikeBatsmanId: openers[1], 
        currentBowlerId: bowler[0], 
        target: currentInningsNum === 2 ? (innings.innings1.score + 1) : 0, 
        previousBowlerId: '', 
        currentOverEvents: [],
        isFreeHit: false,
    }));
    setStage('play');
    setOverHistory([]);
  };

  const endMatch = (winner: string | null, resultDescription: string, finalInnings: { innings1?: Innings, innings2?: Innings }, finalTieBreakers: TieBreaker[]) => {
      const finalMatchData: Partial<Match> = {
          status: 'Completed',
          winner: winner || undefined,
          resultDescription,
          completionDate: new Date().toISOString(),
          innings: finalInnings,
          tieBreakers: finalTieBreakers,
          liveProgress: undefined, // Explicitly clear live progress
          fastestBall: fastestBall,
      };
      
      let finalMatchObject: Match = { ...match, ...finalMatchData };
      const motmId = calculateManOfTheMatch(finalMatchObject, matchPlayers);
      
      finalMatchObject = { ...finalMatchObject, manOfTheMatchId: motmId || undefined };

      onUpdateMatch(finalMatchObject);
      setCompletedMatchData(finalMatchObject);
      setStage('matchOver');
  };

  const handleUndo = () => {
    setOverHistory(prevHistory => {
        if (prevHistory.length === 0) {
            onShowToast('Nothing to undo in this over.', 'error');
            return prevHistory;
        }

        const newHistory = [...prevHistory];
        const lastState = newHistory.pop();

        if (lastState) {
            setInnings(lastState.innings);
            setLiveState(lastState.liveState);
            setFastestBall(lastState.fastestBall);
            onShowToast('Last event undone.', 'success');
        }

        return newHistory;
    });
  };
  
  const handleBallPlayed = (event: string, options?: { batsmanOutId?: string; howOut?: 'Bowled' | 'Caught' | 'LBW' | 'Run Out'; fielderId?: string; runsScored?: number; newBatsmanIdForRunOut?: string; batsmenCrossed?: boolean; }, speed?: number) => {
    setOverHistory(prev => [...prev, { innings, liveState, fastestBall }]);

    let newInningsState = JSON.parse(JSON.stringify(innings));
    let currentInningData: Innings = newInningsState[`innings${currentInningsNum}`];

    const { onStrikeBatsmanId, offStrikeBatsmanId, currentBowlerId, currentOverEvents, target, isFreeHit } = liveState;
    const originalStrikerId = onStrikeBatsmanId;
    const originalNonStrikerId = offStrikeBatsmanId;

    const shortRunMatch = event.match(/^(\d+)S(\d+)$/);
    const isShortRun = !!shortRunMatch;
    const baseEvent = event.split('+')[0];
    let extraRuns = 0;
    const isWicket = baseEvent === 'W' || !!options?.howOut;

    if (event.includes('+')) extraRuns = parseInt(event.split('+')[1], 10);

    const newCurrentOverEvents = [...currentOverEvents, event];

    let runsScored = options?.runsScored ?? 0;
    if (isShortRun) {
        runsScored = parseInt(shortRunMatch![1], 10);
    } else if (['0', '1', '2', '3', '4', '6'].includes(baseEvent)) {
        runsScored = parseInt(baseEvent, 10);
    }

    if (runsScored > 0) {
        currentInningData.score += runsScored;
        if (originalStrikerId) {
            currentInningData.batsmenStats[originalStrikerId].runs += runsScored;
            if (!isShortRun) {
                if (runsScored === 4) currentInningData.batsmenStats[originalStrikerId].fours++;
                if (runsScored === 6) currentInningData.batsmenStats[originalStrikerId].sixes++;
            }
        }
        if (currentBowlerId) currentInningData.bowlerStats[currentBowlerId].runsConceded += runsScored;
    } else if (['Wd', 'Nb'].includes(baseEvent)) {
        const totalRuns = 1 + extraRuns;
        currentInningData.score += totalRuns;
        if (currentBowlerId) currentInningData.bowlerStats[currentBowlerId].runsConceded += totalRuns;
        if (baseEvent === 'Nb' && extraRuns > 0 && originalStrikerId) {
            currentInningData.batsmenStats[originalStrikerId].runs += extraRuns;
            if (extraRuns === 4) currentInningData.batsmenStats[originalStrikerId].fours++;
            if (extraRuns === 6) currentInningData.batsmenStats[originalStrikerId].sixes++;
        }
    }

    const isLegalBall = !['Wd', 'Nb'].includes(baseEvent);
    if (isLegalBall) {
        currentInningData.totalLegalBalls += 1;
        if (originalStrikerId) currentInningData.batsmenStats[originalStrikerId].balls += 1;
        if (currentBowlerId) currentInningData.bowlerStats[currentBowlerId].ballsBowled += 1;

        if (speed && currentBowlerId) {
            if (!fastestBall || speed > fastestBall.speed) {
                setFastestBall({ bowlerId: currentBowlerId, speed });
                onShowToast(`New fastest ball: ${speed} km/h!`, 'success');
            }
        }
    }

    let batsmanOutId = null;
    if (isWicket) {
        batsmanOutId = options?.batsmanOutId || originalStrikerId;
        if (batsmanOutId) {
            const isProtectedDismissal = ['Bowled', 'Caught', 'LBW'].includes(options?.howOut || '');
            if (!(isFreeHit && isProtectedDismissal)) {
                currentInningData.wickets += 1;
                const batsmanStats = currentInningData.batsmenStats[batsmanOutId];
                batsmanStats.isOut = true;
                batsmanStats.howOut = options?.howOut;
                if (options?.howOut && options.howOut !== 'Run Out') {
                    batsmanStats.bowlerId = currentBowlerId;
                    if (currentBowlerId) currentInningData.bowlerStats[currentBowlerId].wickets += 1;
                }
                if (options?.fielderId) batsmanStats.fielderId = options.fielderId;
                currentInningData.fallOfWickets.push({ score: currentInningData.score, wicket: currentInningData.wickets, batsmanId: batsmanOutId });
            } else {
                batsmanOutId = null; // Wicket doesn't count on free hit
            }
        }
    }
    
    const maxOvers = isSuperOver ? 1 : (match.totalOvers || Infinity);
    const maxWickets = isSuperOver ? 2 : 10;
    const availableBatsmenForCheck = matchPlayers.filter(p => match.teams[battingTeamName]?.includes(p.id) && !currentInningData.batsmenStats[p.id]?.isOut);
    const isInningsOver = currentInningData.wickets >= maxWickets || currentInningData.totalLegalBalls >= maxOvers * 6 || (availableBatsmenForCheck.length <= 1 && !isWicket);
    const isTargetReached = (currentInningsNum === 2 && target > 0 && currentInningData.score >= target);

    if (isTargetReached || isInningsOver) {
        if (isTargetReached) {
            const winner = battingTeamName;
            if (isSuperOver) {
                const result = `${winner} won in Super Over`;
                const finalTieBreakers = [...tieBreakers];
                const currentTieBreakerIndex = finalTieBreakers.length - 1;
                if (currentTieBreakerIndex >= 0) { finalTieBreakers[currentTieBreakerIndex] = { ...finalTieBreakers[currentTieBreakerIndex], superOver: newInningsState, resultDescription: result }; setTieBreakers(finalTieBreakers); }
                endMatch(winner, result, tiedMatchInnings!, finalTieBreakers);
            } else {
                const wicketsRemaining = maxWickets - currentInningData.wickets;
                const result = `${winner} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
                endMatch(winner, result, newInningsState, tieBreakers);
            }
            return;
        }
    
        if (isInningsOver) {
            if (isSuperOver) {
                if (currentInningsNum === 1) setStage('inningsBreak');
                else {
                    const score1 = newInningsState.innings1.score; const score2 = newInningsState.innings2.score;
                    let winner: string | null = null; let result = '';
                    if (score1 > score2) { winner = newInningsState.innings1.battingTeam; result = `${winner} won in Super Over`; }
                    else if (score2 > score1) { winner = newInningsState.innings2.battingTeam; result = `${winner} won in Super Over`; }
                    else { result = "Super Over Tied"; }
                    const finalTieBreakers = [...tieBreakers];
                    const currentTieBreakerIndex = finalTieBreakers.length - 1;
                    if (currentTieBreakerIndex >= 0) { finalTieBreakers[currentTieBreakerIndex] = { ...finalTieBreakers[currentTieBreakerIndex], superOver: newInningsState, resultDescription: result }; setTieBreakers(finalTieBreakers); }
                    if (result === "Super Over Tied") { if (finalTieBreakers.length < 2) { setInnings({ innings1: getInitialInningsState(match.players, '', ''), innings2: getInitialInningsState(match.players, '', '') }); setLiveState({ onStrikeBatsmanId: '', offStrikeBatsmanId: '', currentBowlerId: '', previousBowlerId: '', currentOverEvents: [], target: 0, isFreeHit: false }); setOpeners([]); setBowler([]); setStage('tieBreakerSelection'); } else endMatch(null, "Match Tied after multiple Super Overs", tiedMatchInnings!, finalTieBreakers); } else endMatch(winner, result, tiedMatchInnings!, finalTieBreakers);
                }
            } else if (currentInningsNum === 1) setStage('inningsBreak');
            else {
                if (currentInningData.score === target - 1) { setTiedMatchInnings(newInningsState); setStage('tieBreakerSelection'); }
                else { const winner = bowlingTeamName; const runDifference = target - 1 - currentInningData.score; const result = `${winner} won by ${runDifference} run${runDifference !== 1 ? 's' : ''}`; endMatch(winner, result, newInningsState, tieBreakers); }
            }
            setInnings(newInningsState);
            return;
        }
    }
    
    // --- NEW LOGIC FOR BATSMAN POSITIONS ---
    let nextStriker = onStrikeBatsmanId;
    let nextNonStriker = offStrikeBatsmanId;
    
    if (isWicket && batsmanOutId) {
        if (options?.howOut === 'Run Out' && options.newBatsmanIdForRunOut) {
            const newBatsmanId = options.newBatsmanIdForRunOut;
            const runsCompleted = options.runsScored ?? 0;
            const batsmenCrossedOnDismissalAttempt = options.batsmenCrossed === true;
    
            const notOutBatsmanId = batsmanOutId === originalStrikerId ? originalNonStrikerId : originalStrikerId;
            const completedRunsAreOdd = runsCompleted % 2 !== 0;
            
            const strikerAfterCompletedRuns = completedRunsAreOdd ? originalNonStrikerId : originalStrikerId;
            
            if (batsmenCrossedOnDismissalAttempt) {
                if (notOutBatsmanId === strikerAfterCompletedRuns) { // Not out was at striker's end, crossed -> moves to non-striker's end
                    nextNonStriker = notOutBatsmanId;
                    nextStriker = newBatsmanId;
                } else { // Not out was at non-striker's end, crossed -> moves to striker's end
                    nextStriker = notOutBatsmanId;
                    nextNonStriker = newBatsmanId;
                }
            } else {
                if (notOutBatsmanId === strikerAfterCompletedRuns) { // Not out was at striker's end, didn't cross -> stays at striker's end
                    nextStriker = notOutBatsmanId;
                    nextNonStriker = newBatsmanId;
                } else { // Not out was at non-striker's end, didn't cross -> stays at non-striker's end
                    nextNonStriker = notOutBatsmanId;
                    nextStriker = newBatsmanId;
                }
            }
        } else { // Other wickets
            if (batsmanOutId === originalStrikerId) {
                nextStriker = '';
                nextNonStriker = originalNonStrikerId;
            } else {
                nextStriker = originalStrikerId;
                nextNonStriker = '';
            }
        }
    } else { // Not a wicket
        const runsForRotation = isShortRun ? parseInt(shortRunMatch![2], 10) : (['0', '1', '2', '3', '4', '6'].includes(baseEvent) ? parseInt(baseEvent, 10) : (['Wd', 'Nb'].includes(baseEvent) ? extraRuns : 0));
        const strikeRotated = runsForRotation % 2 !== 0;
        if (strikeRotated) {
            [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
        }
    }

    const isNextBallFreeHit = baseEvent === 'Nb' || (isFreeHit && baseEvent === 'Wd');
    const legalBallsInOver = newCurrentOverEvents.filter(e => !['Wd', 'Nb'].includes(e.split('+')[0])).length;
    const isOverEnd = isLegalBall && legalBallsInOver > 0 && legalBallsInOver % 6 === 0;

    if (isOverEnd) {
        [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
    }
    
    setInnings(newInningsState);
    setLiveState({
        onStrikeBatsmanId: nextStriker,
        offStrikeBatsmanId: nextNonStriker,
        currentBowlerId: isOverEnd ? '' : currentBowlerId,
        previousBowlerId: isOverEnd ? currentBowlerId : liveState.previousBowlerId,
        currentOverEvents: isOverEnd ? [] : newCurrentOverEvents,
        target,
        isFreeHit: isNextBallFreeHit
    });
    setCurrentSpeed('');
};


  const handleNewBatsmanSelect = (batsmanId: string) => { setLiveState(prev => ({ ...prev, onStrikeBatsmanId: batsmanId })); };
  const handleNewNonStrikerSelect = (batsmanId: string) => { setLiveState(prev => ({ ...prev, offStrikeBatsmanId: batsmanId })); };
  const handleNewBowlerSelect = (bowlerId: string) => { 
    setLiveState(prev => ({...prev, currentBowlerId: bowlerId})); 
    setOverHistory([]);
  };
  
  const handleStartTieBreaker = (mode: 'superOver' | 'bowlOut') => {
      const newTieBreaker: TieBreaker = { type: mode === 'superOver' ? 'Super Over' : 'Bowl Out' };
      setTieBreakers(prev => [...prev, newTieBreaker]);

      if (mode === 'superOver') {
          setIsSuperOver(true);
          setCurrentInningsNum(1);
          const soBatTeam = innings.innings2.battingTeam;
          const soBowlTeam = innings.innings1.battingTeam;
          setInnings({ innings1: getInitialInningsState(match.players, soBatTeam, soBowlTeam), innings2: getInitialInningsState(match.players, soBowlTeam, soBatTeam) });
          setLiveState({ onStrikeBatsmanId: '', offStrikeBatsmanId: '', currentBowlerId: '', previousBowlerId: '', currentOverEvents: [], target: 0, isFreeHit: false });
          setOpeners([]); setBowler([]);
          setStage('openers');
      } else {
          setBowlOutState({ ...bowlOutState, currentTeam: teamNames[0], currentTurn: 1, teamABowlers: [], teamBBowlers: [] });
          setStage('bowlOutPlay');
          setShowBowlOutBowlerSelection(true);
      }
  };
  
  const handleBowlOutBowlerSelection = (team: 'A' | 'B', bowlers: string[]) => {
      if (team === 'A') {
          setBowlOutState(prev => ({ ...prev, teamABowlers: bowlers }));
          setShowBowlOutBowlerSelection(true);
      } else {
          setBowlOutState(prev => ({ ...prev, teamBBowlers: bowlers }));
          setShowBowlOutBowlerSelection(false);
          setStage('bowlOutPlay');
      }
  }

  const handleBowlOutAttempt = (outcome: 'Hit' | 'Miss') => {
        const { currentTeam, currentTurn, teamABowlers, teamBBowlers, attempts } = bowlOutState;
        const bowlerId = currentTeam === teamNames[0] ? teamABowlers[currentTurn - 1] : teamBBowlers[currentTurn - 1];

        const newAttempts = [...attempts, { teamName: currentTeam, bowlerId, outcome }];

        const teamAHits = newAttempts.filter(a => a.teamName === teamNames[0] && a.outcome === 'Hit').length;
        const teamBHits = newAttempts.filter(a => a.teamName === teamNames[1] && a.outcome === 'Hit').length;
        
        const nextTeam = currentTeam === teamNames[0] ? teamNames[1] : teamNames[0];
        const nextTurn = nextTeam === teamNames[0] ? currentTurn + 1 : currentTurn;
        
        const isBowlOutOver = nextTurn > 5 || 
                              (teamAHits > teamBHits + (5 - (attempts.filter(a => a.teamName === teamNames[1]).length))) ||
                              (teamBHits > teamAHits + (5 - (attempts.filter(a => a.teamName === teamNames[0]).length)));

        if (isBowlOutOver) {
            let winner: string | null = null;
            let result = '';

            if (teamAHits > teamBHits) {
                winner = teamNames[0];
                result = `${winner} won in Bowl Out`;
            } else if (teamBHits > teamAHits) {
                winner = teamNames[1];
                result = `${winner} won in Bowl Out`;
            } else {
                result = 'Bowl Out Tied';
            }

            const finalTieBreakers = [...tieBreakers];
            const currentTieBreakerIndex = finalTieBreakers.length - 1;
            if (currentTieBreakerIndex >= 0) {
                finalTieBreakers[currentTieBreakerIndex] = { ...finalTieBreakers[currentTieBreakerIndex], bowlOutResult: newAttempts, resultDescription: result };
                setTieBreakers(finalTieBreakers);
            }

            if (result === 'Bowl Out Tied') {
                if (finalTieBreakers.length < 2) {
                    setStage('tieBreakerSelection');
                } else {
                    endMatch(null, 'Match Tied after Bowl Out', tiedMatchInnings || innings, finalTieBreakers);
                }
            } else {
                endMatch(winner, result, tiedMatchInnings || innings, finalTieBreakers);
            }
        } else {
            setBowlOutState(prev => ({...prev, attempts: newAttempts, currentTeam: nextTeam, currentTurn: nextTurn }));
        }
  };

  const handleShortRunConfirm = ({ scored, attempted }: { scored: number; attempted: number }) => {
    const event = `${scored}S${attempted}`;
    const speed = parseFloat(currentSpeed) || undefined;
    handleBallPlayed(event, {}, speed);
    setIsShortRunModalOpen(false);
  };

  const availableBatsmen = matchPlayers.filter(p => match.teams[battingTeamName]?.includes(p.id) && !innings[`innings${currentInningsNum}`].batsmenStats[p.id]?.isOut && p.id !== liveState.onStrikeBatsmanId && p.id !== liveState.offStrikeBatsmanId);
  const availableBowlers = matchPlayers.filter(p => match.teams[bowlingTeamName]?.includes(p.id) && p.id !== liveState.currentBowlerId && p.id !== liveState.previousBowlerId);
  const bowlingTeamPlayers = matchPlayers.filter(p => match.teams[bowlingTeamName]?.includes(p.id));

  const ShortRunModal: React.FC<{
      isOpen: boolean;
      onClose: () => void;
      onSubmit: (data: { scored: number; attempted: number }) => void;
    }> = ({ isOpen, onClose, onSubmit }) => {
    const [scored, setScored] = useState('1');
    const [attempted, setAttempted] = useState('2');

    useEffect(() => {
      if (isOpen) {
        setScored('1');
        setAttempted('2');
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const scoredNum = parseInt(scored, 10);
        const attemptedNum = parseInt(attempted, 10);

        if (isNaN(scoredNum) || isNaN(attemptedNum) || scoredNum < 0 || attemptedNum <= 0) {
        onShowToast('Please enter valid, positive numbers.', 'error');
        return;
        }
        if (scoredNum >= attemptedNum) {
        onShowToast('Runs attempted must be greater than runs scored.', 'error');
        return;
        }

        onSubmit({ scored: scoredNum, attempted: attemptedNum });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-xl p-6 text-white animate-in fade-in-0 zoom-in-95">
            <h2 className="text-2xl font-bold text-center mb-6">Record Short Run</h2>
            <div className="space-y-4">
            <div>
                <label htmlFor="runsScored" className="block text-sm font-medium text-gray-300">Runs Scored</label>
                <input type="number" id="runsScored" value={scored} onChange={e => setScored(e.target.value)} className="mt-1 w-full p-2 bg-slate-700 text-gray-200 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. 1" />
            </div>
            <div>
                <label htmlFor="runsAttempted" className="block text-sm font-medium text-gray-300">Runs Attempted</label>
                <input type="number" id="runsAttempted" value={attempted} onChange={e => setAttempted(e.target.value)} className="mt-1 w-full p-2 bg-slate-700 text-gray-200 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. 2" />
            </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
            <button onClick={onClose} className="w-full p-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-500 transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="w-full p-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">Confirm</button>
            </div>
        </div>
        </div>
    );
    };

    const RunOutRunsModal: React.FC<{
        onSelect: (runs: number) => void;
        onClose: () => void;
    }> = ({ onSelect, onClose }) => {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-xl p-6 text-white animate-in fade-in-0 zoom-in-95">
                <h2 className="text-2xl font-bold text-center mb-6">Runs Before Run Out</h2>
                <p className="text-center text-slate-300 mb-4">How many runs were completed before the wicket?</p>
                <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 5].map(runs => (
                    <button
                    key={runs}
                    onClick={() => onSelect(runs)}
                    className="p-4 bg-slate-700 rounded-lg font-bold text-xl hover:bg-orange-600 transition-colors"
                    >
                    {runs}
                    </button>
                ))}
                </div>
                <button onClick={onClose} className="w-full mt-6 p-3 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors">
                Cancel
                </button>
            </div>
            </div>
        );
    };

    const CrossedModal: React.FC<{
      onSelect: (crossed: boolean) => void;
      onClose: () => void;
    }> = ({ onSelect, onClose }) => {
      return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-xl p-6 text-white animate-in fade-in-0 zoom-in-95">
            <h2 className="text-2xl font-bold text-center mb-6">Did Batsmen Cross?</h2>
            <p className="text-center text-slate-300 mb-4">
              Before the run out dismissal was completed, did the batsmen cross for the run attempt?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => onSelect(true)}
                className="px-10 py-4 bg-emerald-600 rounded-lg text-xl font-bold hover:bg-emerald-700"
              >
                Yes
              </button>
              <button
                onClick={() => onSelect(false)}
                className="px-10 py-4 bg-rose-600 rounded-lg text-xl font-bold hover:bg-rose-700"
              >
                No
              </button>
            </div>
            <button onClick={onClose} className="w-full mt-6 p-3 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      );
    };
    
  const renderStage = () => {
    const currentInningData = currentInningsNum === 1 ? innings.innings1 : innings.innings2;
    const { onStrikeBatsmanId, offStrikeBatsmanId, currentBowlerId, currentOverEvents, target } = liveState;
    const onStrikeBatsman = matchPlayers.find(p => p.id === onStrikeBatsmanId);
    const offStrikeBatsman = matchPlayers.find(p => p.id === offStrikeBatsmanId);
    const currentBowler = matchPlayers.find(p => p.id === currentBowlerId);
    
    switch(stage) {
      case 'toss': return <StageWrapper className="text-center"><h1 className="text-4xl font-bold text-white mb-8">{teamNames[0]} vs {teamNames[1]}</h1><button onClick={handleToss} className="px-12 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold text-xl hover:from-orange-600 hover:to-red-700 transition-all">Toss Coin</button></StageWrapper>;
      case 'decision': return <StageWrapper className="text-center"><h1 className="text-3xl font-bold text-white mb-2"><span className="text-amber-400">{tossWinner}</span> won the toss!</h1><p className="text-slate-300 mb-8">What is your decision?</p><div className="flex justify-center gap-4"><button onClick={() => handleDecision('Bat')} className="px-10 py-3 bg-emerald-600 rounded-lg">Bat First</button><button onClick={() => handleDecision('Bowl')} className="px-10 py-3 bg-sky-600 rounded-lg">Bowl First</button></div></StageWrapper>;
      case 'openers': return <StageWrapper className="text-center"><h1 className="text-3xl font-bold text-white mb-2">{isSuperOver ? 'Super Over Setup' : 'Prepare for the Match'}</h1><p className="text-slate-300 mb-6">{battingTeamName} will bat.</p><div className="grid md:grid-cols-2 gap-6"><PlayerSelectionCard title="Select 2 Opening Batters" players={availableBatsmen} selected={openers} onSelect={(id) => handlePlayerSelect(id, 'batsman')} limit={2} /><PlayerSelectionCard title="Select Opening Bowler" players={availableBowlers} selected={bowler} onSelect={(id) => handlePlayerSelect(id, 'bowler')} limit={1} /></div><button onClick={handleStartPlay} disabled={openers.length !== 2 || bowler.length !== 1} className="mt-8 px-10 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg disabled:bg-slate-500">Start Play</button></StageWrapper>;
      case 'inningsBreak': return <StageWrapper className="text-center"><h1 className="text-3xl font-bold text-white mb-2">{isSuperOver ? 'Super Over Break' : 'Innings Break'}</h1><div className="bg-slate-800 p-4 rounded-lg my-4"><p className="text-xl">{innings.innings1.battingTeam}: {innings.innings1.score}/{innings.innings1.wickets}</p><p className="text-amber-400">Target for {innings.innings2.battingTeam} is {isSuperOver ? innings.innings1.score + 1 : innings.innings1.score + 1}</p></div><button onClick={() => { setCurrentInningsNum(2); setStage('openers'); setOpeners([]); setBowler([]); setLiveState(prev => ({...prev, onStrikeBatsmanId:'', offStrikeBatsmanId:'', currentBowlerId:'', target: innings.innings1.score+1, previousBowlerId:'', currentOverEvents: [], isFreeHit: false})); setOverHistory([]); }} className="px-10 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">Start Second Innings</button></StageWrapper>;
      case 'tieBreakerSelection': return <StageWrapper className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Match Tied!</h1>
        {tieBreakers.length > 0 && <p className="text-lg text-amber-400 mb-2">Previous Tie-Breaker was also tied! Choose again.</p> }
        <p className="text-slate-300 mb-8">Choose a tie-breaker method or declare the match a tie.</p>
        <div className="flex justify-center flex-wrap gap-4">
            <button onClick={() => handleStartTieBreaker('superOver')} className="px-10 py-3 bg-amber-600 rounded-lg font-semibold">Start Super Over</button>
            <button onClick={() => handleStartTieBreaker('bowlOut')} className="px-10 py-3 bg-sky-600 rounded-lg font-semibold">Start Bowl Out</button>
            <button onClick={() => endMatch(null, "Match Tied", tiedMatchInnings || innings, tieBreakers)} className="px-10 py-3 bg-slate-600 rounded-lg font-semibold">Declare Tie</button>
        </div>
      </StageWrapper>;
      case 'bowlOutPlay':
          const BowlOutBowlerSelection: React.FC<{teamName: string, onDone: (bowlers: string[]) => void}> = ({teamName, onDone}) => {
              const [selectedBowlers, setSelectedBowlers] = useState<string[]>([]);
              const teamPlayers = matchPlayers.filter(p => match.teams[teamName]?.includes(p.id));
              const toggleBowler = (id: string) => setSelectedBowlers(prev => prev.includes(id) ? prev.filter(b => b !== id) : prev.length < 5 ? [...prev, id] : prev);
              return <div className="fixed inset-0 bg-slate-900/80 z-50 flex justify-center items-center p-4"><div className="w-full max-w-md bg-slate-800 rounded-xl p-6"><h2 className="text-2xl font-bold text-center mb-4">Select 5 Bowlers for {teamName}</h2><div className="space-y-2 max-h-80 overflow-y-auto pr-2">{teamPlayers.map(p => <button key={p.id} onClick={() => toggleBowler(p.id)} className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors ${selectedBowlers.includes(p.id) ? 'bg-gradient-to-r from-orange-500 to-red-600 ring-2' : 'bg-slate-700 hover:bg-slate-600'}`}><img src={p.photoUrl} alt={p.fullName} className="h-10 w-10 rounded-full object-cover" /><span>{p.fullName}</span></button>)}</div><button onClick={() => onDone(selectedBowlers)} disabled={selectedBowlers.length !== 5} className="w-full mt-6 p-3 bg-emerald-600 rounded-lg font-semibold disabled:bg-slate-500">Confirm ({selectedBowlers.length}/5)</button></div></div>
          };
          const { currentTeam, currentTurn, teamABowlers, teamBBowlers, attempts } = bowlOutState;
          if (showBowlOutBowlerSelection) {
              if (!teamABowlers.length) return <BowlOutBowlerSelection teamName={teamNames[0]} onDone={(b) => handleBowlOutBowlerSelection('A', b)} />;
              return <BowlOutBowlerSelection teamName={teamNames[1]} onDone={(b) => handleBowlOutBowlerSelection('B', b)} />;
          }
          const bowlerId = currentTeam === teamNames[0] ? teamABowlers[currentTurn - 1] : teamBBowlers[currentTurn - 1];
          const bowlerName = getPlayerName(bowlerId);
          return <StageWrapper className="text-center"><h1 className="text-3xl font-bold">Bowl Out</h1><div className="my-6 bg-slate-800 p-4 rounded-lg"><p className="text-xl">Attempt {currentTurn} / 5</p><p className="text-2xl font-semibold text-amber-400">Team: {currentTeam}</p><p className="text-lg">Bowler: {bowlerName}</p></div><div className="flex justify-center gap-4"><button onClick={() => handleBowlOutAttempt('Hit')} className="px-10 py-4 bg-emerald-600 rounded-lg text-xl font-bold">Hit</button><button onClick={() => handleBowlOutAttempt('Miss')} className="px-10 py-4 bg-rose-600 rounded-lg text-xl font-bold">Miss</button></div><div className="mt-6 text-left">{attempts.map((a,i) => <p key={i}>{a.teamName} - {getPlayerName(a.bowlerId)}: {a.outcome}</p>)}</div></StageWrapper>;
      case 'matchOver': return <StageWrapper className="max-w-7xl"><ScorecardDisplay match={completedMatchData || match} players={matchPlayers} onExit={onExit} /></StageWrapper>;
      case 'play':
        const isPaused = !onStrikeBatsmanId || !offStrikeBatsmanId || !currentBowlerId || !!extraEventInfo.type || !!wicketTakerInfo.step || runOutRunsSelection || runOutResolution || showCrossedModal;
        const extraRunOptions = extraEventInfo.type === 'Wd' ? ['0', '1', '2', '3', '4'] : ['0', '1', '2', '3', '4', '6'];
        const pwr = isSuperOver ? <span className="text-xs font-bold bg-amber-500 text-black px-2 py-1 rounded-full">SUPER OVER</span> : null;
        const isTargetReachedByPlay = currentInningsNum === 2 && target > 0 && currentInningData.score >= target;

        return <StageWrapper>
            {(!onStrikeBatsmanId || !offStrikeBatsmanId) && !runOutResolution && <SelectionModal title={!onStrikeBatsmanId ? "Select New Striker" : "Select New Non-Striker"} players={availableBatsmen} onSelect={!onStrikeBatsmanId ? handleNewBatsmanSelect : handleNewNonStrikerSelect}/>}
            {!currentBowlerId && onStrikeBatsmanId && offStrikeBatsmanId && <SelectionModal title="Select New Bowler" players={availableBowlers} onSelect={handleNewBowlerSelect} />}
            {wicketTakerInfo.step && <WicketTakerModal isFreeHit={liveState.isFreeHit} step={wicketTakerInfo.step} onClose={() => setWicketTakerInfo({ step: null })} bowlingTeamPlayers={bowlingTeamPlayers} onStrikeBatsman={onStrikeBatsman} offStrikeBatsman={offStrikeBatsman} onBatsmanOutSelect={(batsmanId) => { setWicketTakerInfo({ step: 'runout_fielder', batsmanOutId: batsmanId }); }} onDismissalSelect={(type) => { 
                if (type === 'Bowled' || type === 'LBW') { handleBallPlayed('W', { howOut: type }, speedForWicket); setWicketTakerInfo({ step: null }); } 
                else if (type === 'Caught') { setWicketTakerInfo({ step: 'catcher' }); } 
                else if (type === 'Run Out') { setWicketTakerInfo({ step: null }); setRunOutRunsSelection(true); } 
            }} onFielderSelect={(fielderId, dismissalType) => { 
                if (dismissalType === 'Run Out') {
                    if (wicketFlowState) {
                       setWicketFlowState(prev => ({ ...prev!, batsmanOutId: wicketTakerInfo.batsmanOutId, fielderId }));
                       setRunOutResolution(true);
                    }
                } else { handleBallPlayed('W', { howOut: dismissalType, fielderId }, speedForWicket); }
                setWicketTakerInfo({ step: null });
             }} />}
            <ShortRunModal isOpen={isShortRunModalOpen} onClose={() => setIsShortRunModalOpen(false)} onSubmit={handleShortRunConfirm} />
            {runOutRunsSelection && <RunOutRunsModal onClose={() => setRunOutRunsSelection(false)} onSelect={(runs) => {
                setRunOutRunsSelection(false);
                setWicketFlowState({ baseEvent: String(runs), runsScored: runs, howOut: 'Run Out' });
                setShowCrossedModal(true);
            }} />}
             {showCrossedModal && <CrossedModal 
                onClose={() => { setShowCrossedModal(false); setWicketFlowState(null); }}
                onSelect={(crossed) => {
                    setShowCrossedModal(false);
                    setWicketFlowState(prev => prev ? ({ ...prev, batsmenCrossed: crossed }) : null);
                    setWicketTakerInfo({ step: 'runout_batsman' });
                }}
            />}
            {runOutResolution && <RunOutResolutionModal availableBatsmen={availableBatsmen} onClose={() => { setRunOutResolution(false); setWicketFlowState(null); }} onResolve={(newBatsmanId) => {
                const { runsScored, batsmanOutId, fielderId, batsmenCrossed } = wicketFlowState!;
                handleBallPlayed(String(runsScored), {
                    runsScored, 
                    howOut: 'Run Out', 
                    batsmanOutId, 
                    fielderId,
                    newBatsmanIdForRunOut: newBatsmanId,
                    batsmenCrossed,
                }, speedForWicket);
                setRunOutResolution(false);
                setWicketFlowState(null);
            }} />}
            <div className="bg-slate-800/80 p-4 rounded-lg mb-4 text-center">
                <p className="text-4xl font-bold text-amber-400 flex items-center justify-center gap-4">
                    <span>{battingTeamName} {currentInningData.score}/{currentInningData.wickets}</span>
                    {liveState.isFreeHit && <span className="text-lg font-bold bg-green-500 text-white px-3 py-1 rounded-full animate-pulse">FREE HIT</span>}
                    {pwr}
                </p>
                <p className="text-lg text-slate-300">Overs: {formatOvers(currentInningData.totalLegalBalls)} {isSuperOver ? '/ 1.0' : (match.totalOvers ? `/ ${match.totalOvers}` : '')}</p>
                {currentInningsNum === 2 && target > 0 && <p className="text-amber-300 font-bold">Target: {liveState.target}{isTargetReachedByPlay && <span className="text-emerald-400"> (Reached)</span>}</p>}
                {currentInningsNum === 2 && target > 0 && !isTargetReachedByPlay && (
                    <p className="text-xl text-teal-400 mt-1 animate-pulse">
                        Need <strong>{target - currentInningData.score}</strong> runs in <strong>{(isSuperOver ? 6 : (match.totalOvers || 0) * 6) - currentInningData.totalLegalBalls}</strong> balls
                    </p>
                )}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4"><div className="bg-slate-800/50 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-2 text-orange-400 border-b border-slate-700 pb-2">Batting</h3>{onStrikeBatsman && <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded"><span className="font-bold">{onStrikeBatsman.fullName} *</span><span className="font-mono">{currentInningData.batsmenStats[onStrikeBatsmanId]?.runs} ({currentInningData.batsmenStats[onStrikeBatsmanId]?.balls})</span></div>}{offStrikeBatsman && <div className="flex justify-between items-center p-2 rounded"><span className="font-medium text-slate-300">{offStrikeBatsman.fullName}</span><span className="font-mono text-slate-300">{currentInningData.batsmenStats[offStrikeBatsmanId]?.runs} ({currentInningData.batsmenStats[offStrikeBatsmanId]?.balls})</span></div>}</div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                    <h3 className="text-lg font-semibold text-rose-400">Bowling</h3>
                    {currentBowlerId && currentOverEvents.length === 0 && (
                        <button
                            onClick={() => setLiveState(prev => ({ ...prev, currentBowlerId: '' }))}
                            className="px-2 py-1 text-xs font-semibold text-sky-300 bg-sky-800/50 rounded-md hover:bg-sky-700/50"
                        >
                            Change Bowler
                        </button>
                    )}
                </div>
                {currentBowler && <div className="flex justify-between items-center p-2 rounded"><span className="font-medium text-slate-300">{currentBowler.fullName}</span><span className="font-mono text-slate-300">{formatOvers(currentInningData.bowlerStats[currentBowlerId]?.ballsBowled)}-{currentInningData.bowlerStats[currentBowlerId]?.runsConceded}-{currentInningData.bowlerStats[currentBowlerId]?.wickets}</span></div>}
            </div></div>
            <div className="bg-slate-800/50 p-3 rounded-lg mb-4 flex items-center gap-3 h-14 overflow-x-auto"><span className="font-semibold text-slate-300 flex-shrink-0">This Over:</span>{currentOverEvents.map((event, i) => {
                const shortRunMatch = event.match(/^(\d+)S(\d+)$/);
                const displayEvent = shortRunMatch ? `${shortRunMatch[1]}s` : event;
                const title = shortRunMatch ? `Scored ${shortRunMatch[1]} of ${shortRunMatch[2]} attempted` : `Event: ${event}`;
                
                return (
                    <span key={i} title={title} className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full font-bold ${event.startsWith('W') || event.includes('RO') ? 'bg-rose-500' : (event.includes('4') || event.includes('6')) ? 'bg-amber-500' : 'bg-slate-600'}`}>{displayEvent}</span>
                );
            })}</div>
            {extraEventInfo.type ? (
                <div className="bg-slate-800 p-4 rounded-lg animate-in fade-in-0">
                    <h4 className="text-center text-lg font-semibold mb-3">Extras for {extraEventInfo.type}</h4>
                    <div className="flex flex-wrap justify-center gap-3">
                        {extraRunOptions.map(run => (
                            <button
                                key={run}
                                onClick={() => { handleBallPlayed(`${extraEventInfo.type}+${run}`); setExtraEventInfo({ type: null }); }}
                                className="w-16 h-16 flex items-center justify-center p-3 rounded-lg font-bold text-lg transition-transform transform hover:scale-105 bg-slate-700 hover:bg-orange-600"
                            >
                                +{run}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button onClick={() => { setSpeedForWicket(parseFloat(currentSpeed) || undefined); setRunOutRunsSelection(true); setExtraEventInfo({ type: null }); }} className="p-3 rounded-lg font-bold text-lg transition-transform transform hover:scale-105 bg-rose-600 hover:bg-rose-700">
                            Run Out
                        </button>
                        <button onClick={() => setExtraEventInfo({ type: null })} className="p-3 rounded-lg font-semibold transition-colors bg-slate-600 hover:bg-slate-500">
                            Cancel
                        </button>
                    </div>
                </div>
            )
            : (
              <div>
                <div className={`bg-slate-800 p-4 rounded-lg ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <input 
                            type="number"
                            placeholder="Speed"
                            value={currentSpeed}
                            onChange={e => setCurrentSpeed(e.target.value)}
                            disabled={isPaused}
                            className="w-28 p-2 text-center bg-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg"
                        />
                        <span className="font-semibold text-slate-400">km/h</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {['1', '2', '3', '4', '6', '0', 'Wd', 'SR', 'Nb'].map(event => (
                            <button
                                key={event}
                                onClick={() => {
                                    const speed = parseFloat(currentSpeed) || undefined;
                                    setSpeedForWicket(speed);
                                    if (event === 'Wd' || event === 'Nb') {
                                        setExtraEventInfo({ type: event });
                                    } else if (event === 'SR') {
                                        setIsShortRunModalOpen(true);
                                    } else {
                                        handleBallPlayed(event, {}, speed);
                                    }
                                }}
                                disabled={isPaused}
                                className="w-16 h-16 flex items-center justify-center p-2 rounded-lg font-bold text-lg transition-transform transform hover:scale-105 bg-slate-700 hover:bg-orange-600 disabled:bg-slate-700 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                {event}
                            </button>
                        ))}
                        <button
                            key="Wicket"
                            onClick={() => {
                                setSpeedForWicket(parseFloat(currentSpeed) || undefined);
                                if (liveState.isFreeHit) {
                                    setRunOutRunsSelection(true);
                                } else {
                                    setWicketTakerInfo({ step: 'type' });
                                }
                            }}
                            disabled={isPaused}
                            className="w-16 h-16 flex items-center justify-center p-2 rounded-lg font-bold text-lg text-center transition-transform transform hover:scale-105 bg-rose-700 hover:bg-rose-600 disabled:bg-rose-700 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            W
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                  <button
                      key="undo"
                      onClick={handleUndo}
                      disabled={isPaused || overHistory.length === 0}
                      className="w-full h-14 flex items-center justify-center p-2 rounded-lg font-bold text-lg text-center transition-colors bg-sky-700 hover:bg-sky-600 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <UndoIcon />
                      <span className="ml-2">Undo Last Event</span>
                  </button>
                </div>
              </div>
            )}
          </StageWrapper>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-4 animate-in fade-in-0 overflow-y-auto">
       {stage !== 'matchOver' && <button onClick={onExit} className="absolute top-3 right-3 px-2 py-1 bg-slate-800/30 backdrop-blur-sm text-white rounded-md hover:bg-slate-700/50 z-10 text-xs font-semibold">Exit Match</button>}
       {renderStage()}
    </div>
  );
};