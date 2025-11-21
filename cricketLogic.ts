import { Match, Player, Team, Ball, ExtraType, DismissalType } from '../types';

export const createTeam = (name: string, id: string): Team => ({
  id,
  name,
  players: [],
  isBatting: false,
  totalRuns: 0,
  wickets: 0,
  overs: 0,
  extras: 0,
});

export const createPlayer = (name: string, teamId: string, isCaptain: boolean = false, avatar?: string): Player => ({
  id: crypto.randomUUID(),
  name,
  avatar,
  teamId,
  isCaptain,
  runs: 0,
  ballsFaced: 0,
  fours: 0,
  sixes: 0,
  isOut: false,
  dismissalType: DismissalType.NONE,
  oversBowled: 0,
  runsConceded: 0,
  wickets: 0,
  maidens: 0,
});

export const calculateStrikeRate = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
};

export const calculateEconomy = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  const overs = balls / 6;
  return (runs / overs).toFixed(2);
};

export const formatOvers = (balls: number): string => {
  const completeOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${completeOvers}.${remainingBalls}`;
};

export const getProjectedScore = (currentRuns: number, ballsBowled: number, totalOvers: number): string => {
  if (ballsBowled === 0) return '0';
  const runRate = currentRuns / (ballsBowled / 6);
  return Math.round(runRate * totalOvers).toString();
};

export const determineManOfTheMatch = (match: Match): string => {
  if (!match.winningTeamId) return '';
  
  const allPlayers = [...match.teamA.players, ...match.teamB.players];
  // Filter for winning team players only
  const winningPlayers = allPlayers.filter(p => p.teamId === match.winningTeamId);

  let bestPlayerId = '';
  let highestScore = -1;

  winningPlayers.forEach(player => {
    let score = 0;
    // Batting points
    score += player.runs * 1;
    score += player.fours * 2; // Bonus
    score += player.sixes * 3; // Bonus
    if (player.runs > 50) score += 20;
    
    // Bowling points
    score += player.wickets * 20;
    if (player.wickets >= 3) score += 20;
    if (player.oversBowled > 12 && (player.runsConceded / (player.oversBowled/6)) < 6) score += 10; // Good economy
    
    if (score > highestScore) {
      highestScore = score;
      bestPlayerId = player.id;
    }
  });

  return bestPlayerId;
};

export const getDismissalText = (type: DismissalType): string => {
    switch(type) {
        case DismissalType.BOWLED: return "b";
        case DismissalType.CAUGHT: return "c";
        case DismissalType.LBW: return "lbw";
        case DismissalType.RUN_OUT: return "run out";
        case DismissalType.STUMPED: return "st";
        case DismissalType.HIT_WICKET: return "hw";
        default: return "";
    }
}