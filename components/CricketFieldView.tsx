
import React from 'react';
import type { FieldPosition as Position } from '../types';

interface CricketFieldViewProps {
  positions: Record<string, Position>;
  highlightedPosition: string | null;
  setHighlightedPosition: (position: string | null) => void;
  batterHand: 'right' | 'left';
}

const PlayerIcon: React.FC<{ isHighlighted: boolean }> = ({ isHighlighted }) => (
    <g transform="translate(0, -5)">
        <circle cx="0" cy="-3" r="4" className={isHighlighted ? "fill-amber-400 dark:fill-amber-300" : "fill-teal-500 dark:fill-teal-400"} />
        <path d="M -6,1 C -6,1 -4,5 0,5 C 4,5 6,1 6,1 Z" className={isHighlighted ? "fill-amber-400 dark:fill-amber-300" : "fill-teal-500 dark:fill-teal-400"} />
    </g>
);


const FieldPosition: React.FC<{
  name: string;
  pos: Position;
  isHighlighted: boolean;
  onHover: (name: string | null) => void;
}> = ({ name, pos, isHighlighted, onHover }) => {
  const textHighlightClass = 'fill-gray-900 dark:fill-white font-bold';

  return (
    <g
      onMouseEnter={() => onHover(name)}
      onMouseLeave={() => onHover(null)}
      transform={`translate(${pos.x}, ${pos.y})`}
      className="cursor-pointer transition-all group"
    >
      <g transform={`scale(${isHighlighted ? 1.5 : 1})`} className="transition-transform duration-200">
          <PlayerIcon isHighlighted={isHighlighted} />
      </g>
      <text
        x={0}
        y={15}
        textAnchor={pos.align || 'middle'}
        className={`text-[12px] transition-all duration-200 pointer-events-none group-hover:font-bold ${
          isHighlighted
            ? textHighlightClass
            : 'fill-slate-700 dark:fill-slate-300'
        }`}
      >
        {name}
      </text>
    </g>
  );
};

export const CricketFieldView: React.FC<CricketFieldViewProps> = ({ positions, highlightedPosition, setHighlightedPosition, batterHand }) => {
  return (
    <svg viewBox="0 0 1000 700" className="w-full h-auto" aria-label={`3D Cricket field diagram for a ${batterHand}-handed batter`}>
      <defs>
        <radialGradient id="grassGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{stopColor: "rgb(134, 239, 172)", stopOpacity: 0.5}} />
            <stop offset="100%" style={{stopColor: "rgb(34, 197, 94)", stopOpacity: 0.5}} />
        </radialGradient>
      </defs>

      {/* Outfield Base */}
      <ellipse cx="500" cy="350" rx="480" ry="250" className="fill-green-600/50 dark:fill-green-900/60" transform="translate(0, 10)"/>
      <ellipse cx="500" cy="350" rx="480" ry="250" fill="url(#grassGradient)" />

      {/* 30-yard circle */}
      <ellipse cx="500" cy="350" rx="280" ry="120" strokeDasharray="8 8" className="stroke-white/70 dark:stroke-slate-400/50 fill-none" strokeWidth="2" />
      
      {/* Pitch Area */}
      <path d="M 400 350 L 600 350 L 590 380 L 410 380 Z" className="fill-amber-200/50 dark:fill-amber-800/50" />
      
      {/* Creases */}
      <g className="stroke-white/80 dark:stroke-slate-300/70" strokeWidth="1.5">
        {/* Batting End */}
        <line x1="438" y1="368" x2="562" y2="368" />
        <rect x="495" y="366" width="10" height="4" className="fill-white/80 dark:fill-slate-300/70" />

        {/* Bowling End */}
        <line x1="418" y1="352" x2="582" y2="352" />
        <rect x="495" y="350" width="10" height="4" className="fill-white/80 dark:fill-slate-300/70" />
      </g>
      
      {/* Wickets */}
      <g className="fill-slate-800 dark:fill-slate-200">
        <rect x="498.5" y="340" width="3" height="10" transform="skewY(-10)"/>
        <rect x="498.5" y="360" width="3" height="10" transform="skewY(10)"/>
      </g>

      {/* End Labels */}
      <g className="fill-slate-800 dark:fill-white font-bold text-xs" style={{fontFamily: 'sans-serif'}}>
          <text x="500" y="335" textAnchor="middle">Bowling End</text>
          <text x="500" y="405" textAnchor="middle">Batting End</text>
      </g>

      {/* Fielding Positions */}
      {Object.entries(positions).map(([name, pos]) => (
        <FieldPosition
          key={name}
          name={name}
          pos={pos}
          isHighlighted={highlightedPosition === name}
          onHover={setHighlightedPosition}
        />
      ))}
    </svg>
  );
};
