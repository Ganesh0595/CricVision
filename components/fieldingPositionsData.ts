import type { FieldPosition } from '../types';

export const POSITION_GROUPS = {
  "Behind the Wicket": ["Wicket-keeper", "Long stop", "Fine leg", "Short fine leg", "Deep fine leg"],
  "Slips & Gully": ["First slip", "Second slip", "Third slip", "Fourth slip", "Fly slip", "Gully", "Leg slip", "Leg gully"],
  "Off Side": [
    "Third man", "Short third man", "Point", "Silly point", "Backward point", "Deep backward point",
    "Cover", "Cover point", "Deep cover", "Extra cover", "Deep extra cover",
    "Mid-off", "Silly mid-off", "Long off"
  ],
  "On Side (Leg Side)": [
    "Mid-on", "Silly mid-on", "Long on", "Mid-wicket",
    "Deep mid-wicket", "Square leg", "Backward square leg", "Deep backward square leg",
    "Short leg", "Backward short leg"
  ],
};

export const GLOSSARY = [
    { term: "Silly / Short", definition: "Very close to the batter." },
    { term: "Deep / Long", definition: "Far from the batter, near the boundary." },
    { term: "Wide", definition: "Horizontally further from the batter." },
    { term: "Fine", definition: "More behind the batter's wicket." },
    { term: "Square", definition: "In line with the batter's crease." },
    { term: "Backward", definition: "Behind the batter's crease." },
    { term: "Forward", definition: "In front of the batter's crease." },
    { term: "Mid", definition: "A general term for a position that is neither short nor deep." },
];

export const FIELD_POSITIONS_COORDS: Record<string, FieldPosition> = {
  // Wicket & Slips
  'Wicket-keeper': { x: 500, y: 440 },
  'First slip': { x: 450, y: 435 },
  'Second slip': { x: 405, y: 440 },
  'Third slip': { x: 360, y: 445 },
  'Fourth slip': { x: 315, y: 450 },
  'Fly slip': { x: 260, y: 425 },
  'Gully': { x: 360, y: 390 },
  'Leg slip': { x: 550, y: 435 },
  'Leg gully': { x: 640, y: 390 },

  // Off Side
  'Silly point': { x: 420, y: 340 },
  'Point': { x: 250, y: 365 },
  'Backward point': { x: 250, y: 410 },
  'Deep backward point': { x: 100, y: 470, align: 'end' },
  'Cover point': { x: 280, y: 330 },
  'Cover': { x: 320, y: 290 },
  'Deep cover': { x: 180, y: 250, align: 'end' },
  'Extra cover': { x: 390, y: 250 },
  'Deep extra cover': { x: 280, y: 150, align: 'end' },
  'Silly mid-off': { x: 460, y: 280 },
  'Mid-off': { x: 430, y: 210 },
  'Long off': { x: 450, y: 120 },
  'Short third man': { x: 280, y: 490 },
  'Third man': { x: 120, y: 550, align: 'end' },
  
  // Leg Side
  'Short leg': { x: 580, y: 340 },
  'Backward short leg': { x: 610, y: 370 },
  'Square leg': { x: 750, y: 365 },
  'Backward square leg': { x: 750, y: 410 },
  'Deep backward square leg': { x: 900, y: 470, align: 'start' },
  'Mid-wicket': { x: 680, y: 290 },
  'Deep mid-wicket': { x: 820, y: 250, align: 'start' },
  'Silly mid-on': { x: 540, y: 280 },
  'Mid-on': { x: 570, y: 210 },
  'Long on': { x: 550, y: 120 },
  'Short fine leg': { x: 720, y: 490 },
  'Fine leg': { x: 880, y: 550, align: 'start' },
  'Long stop': { x: 500, y: 560 },
  'Deep fine leg': { x: 750, y: 560, align: 'start' },
};

const mirrorAlign = (align?: 'middle' | 'start' | 'end'): 'middle' | 'start' | 'end' | undefined => {
  if (align === 'start') return 'end';
  if (align === 'end') return 'start';
  return align;
};

export const FIELD_POSITIONS_COORDS_LEFT: Record<string, FieldPosition> = Object.fromEntries(
  Object.entries(FIELD_POSITIONS_COORDS).map(([name, pos]) => [
    name,
    {
      ...pos,
      x: 1000 - pos.x,
      align: mirrorAlign(pos.align),
    },
  ])
);
