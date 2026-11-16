
export enum MatchStatus {
  SCHEDULED = 'SCHEDULED', // New status for scheduled matches
  SETUP = 'SETUP',
  TOSS = 'TOSS',
  LIVE = 'LIVE',
  TIED = 'TIED', // New status for choosing Super Over
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
  OBSTRUCTING_FIELD = 'OBSTRUCTING_FIELD',
}

export enum ExtraType {
  NONE = 'NONE',
  WIDE = 'WIDE',
  NO_BALL = 'NO_BALL',
  BYE = 'BYE',
  LEG_BYE = 'LEG_BYE',
}

export interface SuperOverPlayerStats {
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType: DismissalType;
  oversBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  teamId: string;
  isCaptain: boolean;
  // Batting Stats (Main Innings)
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType: DismissalType;
  // Bowling stats (Main Innings)
  oversBowled: number; // actually balls bowled
  runsConceded: number;
  wickets: number;
  maidens: number;
  // Fielding stats
  catches: number;
  runOuts: number;
  stumpings: number;
  // Super Over Specific Stats
  superOverStats?: SuperOverPlayerStats;
}

export interface PersistentTeam {
  id: string;
  name: string;
  logoUrl?: string;
  roster: any[]; // Supports both legacy strings and new {id, name, avatar, mobileNo} objects
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

  // Super Over Stats
  superOverRuns: number;
  superOverWickets: number;
  superOverBalls: number;
}

export interface Ball {
  id: string;
  overNumber: number;
  ballNumber: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runsScored: number;
  extraType: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  dismissalType: DismissalType;
  dismissedPlayerId?: string;
  fielderId?: string;       // catcher / stumper
  runOutFielderId?: string; // run-out effector
  timestamp: number;
  isSuperOver: boolean;
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
  currentInnings: 1 | 2 | 3 | 4; // 3 & 4 are Super Overs
  balls: Ball[];

  // State tracking
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  winningTeamId?: string;
  manOfTheMatchId?: string;
  seriesId?: string;
  tournamentId?: string;
  fixtureId?: string;
  youtubeUrl?: string;
  scheduledDate?: number; // timestamp in ms for when the match is explicitly scheduled
}

export interface Series {
  id: string;
  date: number;
  name: string;
  teamAName: string;
  teamBName: string;
  teamASquad: string[];
  teamBSquad: string[];
  teamAWins: number;
  teamBWins: number;
  draws: number;
  matches: Match[];
  status: 'ACTIVE' | 'COMPLETED';
  winner?: string;
  manOfSeries?: Player;
}

export interface AnimationEvent {
  type: 'FOUR' | 'SIX' | 'WICKET' | 'WIN' | 'INNINGS_BREAK' | 'MOTM' | 'NONE';
  message: string;
  subMessage?: string;
  player?: Player;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  mobileNo?: string;
}

// ─── Tournament Types ─────────────────────────────────────────────────────────

export type TournamentFormat = 'KNOCKOUT' | 'LEAGUE';

export interface TournamentFixture {
  id: string;
  round: number;
  label: string;       // e.g. 'Quarter-Final 1', 'Semi-Final A', 'Final'
  team1: string;       // team name
  team2: string;
  matchId?: string;    // linked Match.id when played
  winner?: string;     // team name of winner
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
  team1Score?: string; // display string e.g. '145/6'
  team2Score?: string;
}

export interface PointsTableEntry {
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  runsAgainst: number;
  ballsFor: number;
  ballsAgainst: number;
  nrr: number;
}

export interface Tournament {
  id: string;
  name: string;
  date: number;
  format: TournamentFormat;
  overs: number;
  playersPerTeam?: number;
  teams: string[];
  fixtures: TournamentFixture[];
  pointsTable: PointsTableEntry[];
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED';
  champion?: string;
  currentRound: number;
  sponsorName?: string;
  sponsorImage?: string;
  scheduleMode?: 'AUTO' | 'MANUAL';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'NEW_CHALLENGE' | 'CHALLENGE_ACCEPTED' | 'SYSTEM';
  message: string;
  isRead: boolean;
  createdAt: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  teamName: string;
  matchType: 'T20' | 'T10' | 'TEST' | 'CUSTOM';
  location: string;
  date: number; // timestamp
  message: string;
  contactInfo: string;
  status: 'OPEN' | 'ACCEPTED';
  createdAt: number;
}

export type AppTheme = 'light' | 'red' | 'green' | 'black' | 'creamy';

