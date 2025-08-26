

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export enum PlayerRole {
  Batter = 'Batter',
  Bowler = 'Bowler',
  AllRounder = 'All-Rounder'
}

export interface Player {
  id: string;
  fullName: string;
  email: string;
  dob: string;
  gender: Gender;
  role: PlayerRole;
  state: string;
  country: string;
  photoUrl: string;
  registrationDate: string;
  jerseyNumber?: number;
}

export interface BatsmanStats {
  runs: number;
  balls: number;
  isOut: boolean;
  fours: number;
  sixes: number;
  howOut?: 'Bowled' | 'Caught' | 'LBW' | 'Run Out';
  fielderId?: string; // for catches, run outs
  bowlerId?: string; // the bowler who gets the wicket credit
}

export interface BowlerStats {
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
}

export interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  score: number;
  wickets: number;
  totalLegalBalls: number;
  batsmenStats: { [playerId: string]: BatsmanStats };
  bowlerStats: { [playerId:string]: BowlerStats };
  fallOfWickets: { score: number; wicket: number; batsmanId: string }[];
}

export type FeeStatus = 'Paid' | 'Unpaid' | 'Exempt';

export interface BowlOutAttempt {
  teamName: string;
  bowlerId: string;
  outcome: 'Hit' | 'Miss';
}

export interface Withdrawal {
  id: string;
  amount: number;
  reason: string;
  date: string;
  personName?: string;
}

export interface TieBreaker {
  type: 'Super Over' | 'Bowl Out';
  superOver?: { innings1?: Innings; innings2?: Innings };
  bowlOutResult?: BowlOutAttempt[];
  resultDescription?: string;
}

export type LiveMatchStage = 'toss' | 'decision' | 'openers' | 'play' | 'inningsBreak' | 'matchOver' | 'tieBreakerSelection' | 'bowlOutPlay';

export interface LiveState {
  onStrikeBatsmanId: string;
  offStrikeBatsmanId: string;
  currentBowlerId: string;
  previousBowlerId: string;
  currentOverEvents: string[];
  target: number;
  isFreeHit: boolean;
}

export interface LiveMatchProgress {
  stage: LiveMatchStage;
  currentInningsNum: 1 | 2;
  innings: {
    innings1: Innings;
    innings2: Innings;
  };
  liveState: LiveState;
}

export interface Match {
  id: string;
  name: string;
  date: string;
  time?: string;
  players: string[]; // array of player IDs
  teams: {
    [teamName: string]: string[]; // e.g. { "Team A": ["p1", "p2"], "Team B": ["p3", "p4"] }
  };
  captains?: {
    [teamName: string]: string;
  };
  status: 'Scheduled' | 'Live' | 'Completed';
  winner?: string; // team name
  resultDescription?: string; // e.g., "Team A won by 20 runs"
  fees: { [playerId: string]: FeeStatus };
  feePerPlayer?: number;
  tossWinner?: string; // team name
  decision?: 'Bat' | 'Bowl';
  totalOvers?: number;
  innings?: {
      innings1?: Innings,
      innings2?: Innings
  };
  liveProgress?: LiveMatchProgress;
  completionDate?: string;
  manOfTheMatchId?: string;
  tieBreakers?: TieBreaker[];
}

export type SortConfig = {
  key: keyof Player;
  direction: 'ascending' | 'descending';
} | null;

export type View = 'dashboard' | 'scheduling' | 'fees' | 'import-export' | 'rules' | 'profile' | 'fielding-positions' | 'finance';

export interface FieldPosition {
  x: number;
  y: number;
  align?: 'middle' | 'start' | 'end';
}
