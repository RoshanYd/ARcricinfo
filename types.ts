export enum MatchStatus {
  SETUP = 'SETUP',
  TOSS = 'TOSS',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
}

export enum DismissalType {
  NONE = 'NONE',
  BOWLED = 'BOWLED',
  CAUGHT = 'CAUGHT',
  LBW = 'LBW',
  RUN_OUT = 'RUN_OUT',
  STUMPED = 'STUMPED',
  HIT_WICKET = 'HIT_WICKET',
}

export enum ExtraType {
  NONE = 'NONE',
  WIDE = 'WIDE',
  NO_BALL = 'NO_BALL',
  BYE = 'BYE',
  LEG_BYE = 'LEG_BYE',
}

export interface Player {
  id: string;
  name: string;
  avatar?: string; // Added avatar URL
  teamId: string;
  isCaptain: boolean;
  // Stats for current match
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType: DismissalType;
  // Bowling stats
  oversBowled: number; // actually balls bowled, convert to overs for display
  runsConceded: number;
  wickets: number;
  maidens: number;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  isBatting: boolean;
  totalRuns: number;
  wickets: number;
  overs: number; // balls bowled
  extras: number;
}

export interface Ball {
  id: string;
  overNumber: number;
  ballNumber: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runsScored: number; // Runs off the bat
  extraType: ExtraType;
  extraRuns: number; // Runs from extras
  isWicket: boolean;
  dismissalType: DismissalType;
  dismissedPlayerId?: string;
  timestamp: number;
}

export interface Match {
  id: string;
  date: number;
  status: MatchStatus;
  totalOvers: number;
  teamA: Team;
  teamB: Team;
  tossWinnerId?: string;
  battingFirstId?: string;
  currentInnings: 1 | 2;
  balls: Ball[]; // Linear history of all balls
  
  // State tracking
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  winningTeamId?: string;
  manOfTheMatchId?: string;
}

// Helper for clean UI updates
export interface AnimationEvent {
  type: 'FOUR' | 'SIX' | 'WICKET' | 'WIN' | 'INNINGS_BREAK' | 'NONE';
  message: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}