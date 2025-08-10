

import React, { useState } from 'react';
import { CricketFieldView } from './CricketFieldView';
import { POSITION_GROUPS, GLOSSARY, FIELD_POSITIONS_COORDS, FIELD_POSITIONS_COORDS_LEFT } from './fieldingPositionsData';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md h-full ${className}`}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        {children}
    </div>
);


export const FieldingPositions: React.FC = () => {
    const [highlightedPosition, setHighlightedPosition] = useState<string | null>(null);
    const [batterHand, setBatterHand] = useState<'right' | 'left'>('right');

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cricket Fielding Positions</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    An interactive guide to standard fielding positions for a <strong className="text-orange-500">{batterHand}-handed</strong> batter. Hover over a name or a point on the field to see its location.
                </p>

                <div className="mb-8 flex justify-center">
                    <div className="flex space-x-1 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-xl">
                      <button 
                        onClick={() => setBatterHand('right')} 
                        className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${batterHand === 'right' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
                        aria-pressed={batterHand === 'right'}
                      >
                        Right-Handed Batter
                      </button>
                      <button 
                        onClick={() => setBatterHand('left')} 
                        className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${batterHand === 'left' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
                        aria-pressed={batterHand === 'left'}
                      >
                        Left-Handed Batter
                      </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                   <div className="lg:col-span-3 bg-green-200/50 dark:bg-green-900/20 p-4 rounded-2xl flex items-center justify-center">
                       <CricketFieldView 
                         positions={batterHand === 'right' ? FIELD_POSITIONS_COORDS : FIELD_POSITIONS_COORDS_LEFT}
                         highlightedPosition={highlightedPosition}
                         setHighlightedPosition={setHighlightedPosition}
                         batterHand={batterHand}
                       />
                   </div>
                    <div className="lg:col-span-2 space-y-6">
                        <InfoCard title="Fielding Position Groups" className="max-h-[60vh] overflow-y-auto">
                           <div className="grid grid-cols-1 gap-y-6">
                                {Object.entries(POSITION_GROUPS).map(([group, list]) => (
                                    <div key={group}>
                                        <h4 className="font-semibold text-lg text-teal-500 dark:text-teal-400 mb-2">{group}</h4>
                                        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                            {list.map(pos => (
                                              <li 
                                                key={pos}
                                                onMouseEnter={() => setHighlightedPosition(pos)}
                                                onMouseLeave={() => setHighlightedPosition(null)}
                                                className={`p-2 rounded-md transition-colors cursor-pointer ${highlightedPosition === pos ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-semibold' : ''}`}
                                              >
                                                {pos}
                                              </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                           </div>
                        </InfoCard>
                        <InfoCard title="Glossary">
                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                {GLOSSARY.map(item => (
                                    <li key={item.term}>
                                        <strong className="font-semibold text-gray-800 dark:text-gray-200">{item.term}:</strong> {item.definition}
                                    </li>
                                ))}
                            </ul>
                        </InfoCard>
                   </div>
                </div>
            </div>
        </div>
    );
};