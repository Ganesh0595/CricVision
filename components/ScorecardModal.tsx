

import React, { useState } from 'react';
import { Match, Player, PlayerRole, Innings, BatsmanStats, BowlOutAttempt } from '../types';
import { BatIcon, BowlingIcon, AllRounderIcon, FileDownloadIcon, PdfIcon, ExcelIcon, XIcon, TrophyIcon } from './Icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ScorecardModalProps {
  match: Match | null;
  players: Player[];
  onClose: () => void;
}

const formatOvers = (balls: number) => {
    if (!balls || balls < 0) return '0.0';
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
};

export const ScorecardModal: React.FC<ScorecardModalProps> = ({ match, players, onClose }) => {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    
    const getPlayerName = (id: string) => players.find(p => p.id === id)?.fullName || 'Unknown';
    const calcSR = (r: number, b: number) => b > 0 ? ((r / b) * 100).toFixed(2) : '0.00';
    const calcEcon = (r: number, b: number) => b > 0 ? ((r / (b/6))).toFixed(2) : '0.00';

    const getDismissalString = (batsmanStats: BatsmanStats): string => {
        if (!batsmanStats.isOut) return 'not out';
        const bowlerName = getPlayerName(batsmanStats.bowlerId || '');
        switch (batsmanStats.howOut) {
            case 'Bowled': return `b. ${bowlerName}`;
            case 'Caught': return `c. ${getPlayerName(batsmanStats.fielderId || '')} b. ${bowlerName}`;
            case 'LBW': return `lbw b. ${bowlerName}`;
            case 'Run Out':
                const fielderName = getPlayerName(batsmanStats.fielderId || '');
                return `run out (${fielderName})`;
            default: return 'out';
        }
    };
    
    const addInningsToPdf = (doc: jsPDF, inn: Innings, startY: number, titlePrefix = '') => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${titlePrefix}${inn.battingTeam} Innings: ${inn.score}/${inn.wickets} (${formatOvers(inn.totalLegalBalls)} Overs)`, 14, startY);
        let currentY = startY + 5;

        (doc as any).autoTable({
            startY: currentY,
            head: [['Batsman', 'Status', 'R', 'B', '4s', '6s', 'S/R']],
            body: match?.teams[inn.battingTeam].map(pId => {
                const stats = inn.batsmenStats[pId];
                if (!stats || (stats.balls === 0 && !stats.isOut)) return null;
                return [ getPlayerName(pId), getDismissalString(stats), stats.runs, stats.balls, stats.fours, stats.sixes, calcSR(stats.runs, stats.balls) ];
            }).filter(Boolean) as (string|number)[][],
            theme: 'striped', headStyles: { fillColor: [41, 128, 185] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
        
        (doc as any).autoTable({
            startY: currentY,
            head: [['Bowler', 'O', 'R', 'W', 'Econ.']],
            body: match?.teams[inn.bowlingTeam].map(pId => {
                const stats = inn.bowlerStats[pId];
                if (!stats || stats.ballsBowled === 0) return null;
                return [ getPlayerName(pId), formatOvers(stats.ballsBowled), stats.runsConceded, stats.wickets, calcEcon(stats.runsConceded, stats.ballsBowled) ];
            }).filter(Boolean) as (string|number)[][],
            theme: 'striped', headStyles: { fillColor: [22, 160, 133] }
        });
        return (doc as any).lastAutoTable.finalY + 15;
    };

    const handleDownloadPDF = () => {
        if (!match) return;
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(match.name, 14, 22);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(match.resultDescription || `Winner: ${match.winner}`, 14, 30);
        
        let startY = 38;
        if (match.manOfTheMatchId) {
            doc.setFont('helvetica', 'bold');
            doc.text(`Man of the Match: ${getPlayerName(match.manOfTheMatchId)}`, 14, startY);
            startY += 8;
        }

        if(match.innings?.innings1) startY = addInningsToPdf(doc, match.innings.innings1, startY);
        if(match.innings?.innings2) { doc.addPage(); startY = 20; startY = addInningsToPdf(doc, match.innings.innings2, startY); }
        
        (match.tieBreakers || []).forEach((tb, index) => {
            doc.addPage(); startY = 20;
            if (tb.type === 'Super Over' && tb.superOver) {
                if(tb.superOver.innings1) startY = addInningsToPdf(doc, tb.superOver.innings1, startY, `Super Over ${index + 1}: `);
                if (tb.superOver.innings2) {
                    if (startY > 250) { doc.addPage(); startY = 20; }
                    startY = addInningsToPdf(doc, tb.superOver.innings2, startY, `Super Over ${index + 1}: `);
                }
            }
            if (tb.type === 'Bowl Out' && tb.bowlOutResult) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Bowl Out ${index + 1} Results`, 14, startY);
                const bowlOutBody = tb.bowlOutResult.map(a => [a.teamName, getPlayerName(a.bowlerId), a.outcome]);
                (doc as any).autoTable({ startY: startY + 5, head: [['Team', 'Bowler', 'Outcome']], body: bowlOutBody, theme: 'striped', headStyles: { fillColor: [192, 57, 43] } });
            }
        });

        doc.save(`${match.name.replace(/ /g, '_')}_scorecard.pdf`);
    };

    const addInningsToSheet = (wb: XLSX.WorkBook, inn: Innings, sheetNamePrefix = '') => {
        if (!match) return;
        const battingData = match.teams[inn.battingTeam].map(pId => { 
            const s = inn.batsmenStats[pId]; 
            if (!s || (s.balls === 0 && !s.isOut)) return null;
            return {'Batsman': getPlayerName(pId), 'Status': getDismissalString(s), 'Runs': s.runs, 'Balls': s.balls, '4s': s.fours, '6s': s.sixes, 'SR': calcSR(s.runs, s.balls) }; 
        }).filter(Boolean);
        const bowlingData = match.teams[inn.bowlingTeam].map(pId => { 
            const s = inn.bowlerStats[pId]; 
            if(!s || s.ballsBowled === 0) return null; 
            return {'Bowler': getPlayerName(pId), 'Overs': formatOvers(s.ballsBowled), 'Runs Conceded': s.runsConceded, 'Wickets': s.wickets, 'Econ': calcEcon(s.runsConceded, s.ballsBowled) }; 
        }).filter(Boolean);
        const ws = XLSX.utils.json_to_sheet(battingData as any[], {header: ['Batsman', 'Status', 'Runs', 'Balls', '4s', '6s', 'SR']});
        XLSX.utils.sheet_add_aoa(ws, [[' ']], {origin: -1});
        XLSX.utils.sheet_add_json(ws, bowlingData as any[], {origin: -1, skipHeader: false});
        XLSX.utils.book_append_sheet(wb, ws, `${sheetNamePrefix}${inn.battingTeam.substring(0, 20)} Innings`);
    }

    const handleDownloadExcel = () => {
        if (!match) return;
        const wb = XLSX.utils.book_new();

        const summaryData = [
            ['Match', match.name],
            ['Result', match.resultDescription || `Winner: ${match.winner}`],
        ];
        if (match.manOfTheMatchId) {
            summaryData.push(['Man of the Match', getPlayerName(match.manOfTheMatchId)]);
        }
        const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws_summary, 'Summary');

        if (match.innings?.innings1) addInningsToSheet(wb, match.innings.innings1);
        if (match.innings?.innings2) addInningsToSheet(wb, match.innings.innings2);
        
        (match.tieBreakers || []).forEach((tb, index) => {
             if (tb.type === 'Super Over' && tb.superOver) {
                if(tb.superOver.innings1) addInningsToSheet(wb, tb.superOver.innings1, `SO${index + 1} `);
                if(tb.superOver.innings2) addInningsToSheet(wb, tb.superOver.innings2, `SO${index + 1} `);
            }
            if (tb.type === 'Bowl Out' && tb.bowlOutResult) {
                const bowlOutData = tb.bowlOutResult.map(a => ({ Team: a.teamName, Bowler: getPlayerName(a.bowlerId), Outcome: a.outcome }));
                const ws = XLSX.utils.json_to_sheet(bowlOutData);
                XLSX.utils.book_append_sheet(wb, ws, `Bowl Out ${index + 1}`);
            }
        });

        XLSX.writeFile(wb, `${match.name.replace(/ /g, '_')}_scorecard.xlsx`);
    };

    if (!match) return null;
    const { innings, teams, winner, resultDescription, manOfTheMatchId } = match;

    const InningsCard: React.FC<{ innings: Innings; titlePrefix?: string }> = ({ innings, titlePrefix = "" }) => (
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl space-y-4">
            <header className="border-b-2 border-slate-200 dark:border-slate-600 pb-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{titlePrefix}{innings.battingTeam}</h3>
                <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{innings.score}/{innings.wickets} <span className="text-lg text-slate-500 dark:text-slate-400">({formatOvers(innings.totalLegalBalls)} ov)</span></p>
            </header>
            <div className="text-sm overflow-x-auto"><table className="w-full text-left table-auto"><thead><tr className="text-slate-500 dark:text-slate-400"><th className="p-1 font-semibold">Batsman</th><th className="p-1 text-center">R</th><th className="p-1 text-center">B</th><th className="p-1 text-center">4s</th><th className="p-1 text-center">6s</th><th className="p-1 text-center">S/R</th></tr></thead><tbody>{teams[innings.battingTeam].map(pId => { const stats = innings.batsmenStats[pId]; if(!stats || (stats.balls === 0 && !stats.isOut)) return null; return (<tr key={pId} className="border-t border-slate-200 dark:border-slate-600/50"><td className="p-1.5"><span className="font-semibold text-gray-800 dark:text-gray-200">{getPlayerName(pId)}</span><span className={`block text-xs ${stats.isOut ? 'text-rose-500' : 'text-emerald-500'}`}>{getDismissalString(stats)}</span></td><td className="p-1.5 text-center font-mono">{stats.runs}</td><td className="p-1.5 text-center font-mono">{stats.balls}</td><td className="p-1.5 text-center font-mono">{stats.fours}</td><td className="p-1.5 text-center font-mono">{stats.sixes}</td><td className="p-1.5 text-center font-mono">{calcSR(stats.runs, stats.balls)}</td></tr>)})}</tbody></table></div>
            <div className="text-sm pt-2 overflow-x-auto"><table className="w-full text-left table-auto"><thead className="border-t-2 border-slate-200 dark:border-slate-600"><tr className="text-slate-500 dark:text-slate-400"><th className="p-1 pt-3 font-semibold">Bowler</th><th className="p-1 pt-3 text-center">O</th><th className="p-1 pt-3 text-center">R</th><th className="p-1 pt-3 text-center">W</th><th className="p-1 pt-3 text-center">Econ.</th></tr></thead><tbody>{teams[innings.bowlingTeam].map(pId => { const stats = innings.bowlerStats[pId]; if(!stats || stats.ballsBowled === 0) return null; return (<tr key={pId} className="border-t border-slate-200 dark:border-slate-600/50"><td className="p-1.5 font-semibold text-gray-800 dark:text-gray-200">{getPlayerName(pId)}</td><td className="p-1.5 text-center font-mono">{formatOvers(stats.ballsBowled)}</td><td className="p-1.5 text-center font-mono">{stats.runsConceded}</td><td className="p-1.5 text-center font-mono">{stats.wickets}</td><td className="p-1.5 text-center font-mono">{calcEcon(stats.runsConceded, stats.ballsBowled)}</td></tr>)})}</tbody></table></div>
        </div>
    );
    
    const BowlOutDisplay: React.FC<{ bowlOutResult: BowlOutAttempt[], title: string }> = ({ bowlOutResult, title }) => {
        const teamNames = Object.keys(match.teams);
        const teamAHits = bowlOutResult.filter(a => a.teamName === teamNames[0] && a.outcome === 'Hit').length;
        const teamBHits = bowlOutResult.filter(a => a.teamName === teamNames[1] && a.outcome === 'Hit').length;

        return (
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl space-y-4 md:col-span-2">
                <header className="border-b-2 border-slate-200 dark:border-slate-600 pb-2 mb-2"><h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3></header>
                <div className="flex justify-around text-center text-lg font-bold text-gray-800 dark:text-gray-200"><span>{teamNames[0]}: {teamAHits} Hits</span><span>{teamNames[1]}: {teamBHits} Hits</span></div>
                <div className="text-sm overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-slate-500 dark:text-slate-400"><th className="p-1 font-semibold">Team</th><th className="p-1 font-semibold">Bowler</th><th className="p-1 text-center">Outcome</th></tr></thead><tbody>
                    {bowlOutResult.map((attempt, index) => (<tr key={index} className="border-t border-slate-200 dark:border-slate-600/50"><td className="p-1.5 text-gray-800 dark:text-gray-200">{attempt.teamName}</td><td className="p-1.5 text-gray-800 dark:text-gray-200">{getPlayerName(attempt.bowlerId)}</td><td className={`p-1.5 text-center font-semibold ${attempt.outcome === 'Hit' ? 'text-emerald-500' : 'text-rose-500'}`}>{attempt.outcome}</td></tr>))}
                </tbody></table></div>
            </div>
        );
     };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-6 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{match.name}</h2>
                        <p className="text-amber-600 dark:text-amber-400 font-semibold">{resultDescription || `Winner: ${winner}`}</p>
                         {manOfTheMatchId && (
                            <div className="mt-2 flex items-center gap-2 text-lg text-yellow-400">
                                <TrophyIcon className="h-6 w-6 text-yellow-400" />
                                <span>Man of the Match: <strong>{getPlayerName(manOfTheMatchId)}</strong></span>
                            </div>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white transition-colors" aria-label="Close modal"><XIcon /></button>
                </header>
                
                <main className="p-6 overflow-y-auto">
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
                </main>

                <footer className="flex-shrink-0 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200 dark:border-slate-700">
                     <div className="relative">
                        <button onClick={() => setIsDownloadOpen(prev => !prev)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"><FileDownloadIcon /><span>Download Scorecard</span></button>
                        {isDownloadOpen && <div className="absolute bottom-full mb-2 w-full bg-slate-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2"><button onClick={()=>{ handleDownloadPDF(); setIsDownloadOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors text-white"><PdfIcon className="text-rose-400" /><span>As PDF</span></button><button onClick={()=>{ handleDownloadExcel(); setIsDownloadOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-600 transition-colors text-white"><ExcelIcon className="text-emerald-400" /><span>As Excel</span></button></div>}
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Close</button>
                </footer>
            </div>
        </div>
    );
};
