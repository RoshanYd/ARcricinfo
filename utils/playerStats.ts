import { Match, Player, DismissalType } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlayerMatchStats {
    playerId_name: string; // normalized: lowercase trim of player name
    name: string;
    avatar?: string;
    teamName: string;
    matchId: string;
    matchDate: number;
    opponentTeam: string;
    result: 'WON' | 'LOST' | 'DRAW';

    // Batting
    didBat: boolean;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isNotOut: boolean;
    strikeRate: number;

    // Bowling
    didBowl: boolean;
    wickets: number;
    runsConceded: number;
    oversBowled: number; // in decimal e.g. 3.4
    economy: number;

    // Fielding
    catches: number;
    runOuts: number;
    stumpings: number;
}

export interface CareerStats {
    playerId: string;
    name: string;
    avatar?: string;

    // Batting
    matchesPlayed: number;
    inningsBatted: number;
    totalRuns: number;
    totalBalls: number;
    fours: number;
    sixes: number;
    fifties: number;
    hundreds: number;
    highestScore: number;
    notOuts: number;
    battingAverage: number;
    strikeRate: number;

    // Bowling
    inningsBowled: number;
    totalWickets: number;
    ballsBowled: number;
    runsConceded: number;
    bowlingAverage: number;
    economy: number;
    fourFors: number;
    fiveFors: number;
    bestBowlingWickets: number;
    bestBowlingRuns: number;

    // Fielding
    catches: number;
    runOuts: number;
    stumpings: number;
}

// Normalize player name → consistent identity key
export const normalizePlayerName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, '_');

// ─── Extract per-match stats for all players ─────────────────────────────────

export function extractPlayerStatsFromMatch(match: Match): PlayerMatchStats[] {
    const result: PlayerMatchStats[] = [];
    const allTeams = [match.teamA, match.teamB];

    allTeams.forEach(team => {
        const opponentTeam = team.id === match.teamA.id ? match.teamB.name : match.teamA.name;

        let matchResult: 'WON' | 'LOST' | 'DRAW' = 'DRAW';
        if (match.winningTeamId === team.id) matchResult = 'WON';
        else if (match.winningTeamId && match.winningTeamId !== team.id) matchResult = 'LOST';

        team.players.forEach(p => {
            const didBat = p.ballsFaced > 0 || p.runs > 0;
            const didBowl = p.oversBowled > 0;
            const oversDecimal = p.oversBowled > 0
                ? Math.floor(p.oversBowled / 6) + (p.oversBowled % 6) / 10
                : 0;

            result.push({
                playerId_name: normalizePlayerName(p.name),
                name: p.name,
                avatar: p.avatar,
                teamName: team.name,
                matchId: match.id,
                matchDate: match.date,
                opponentTeam,
                result: matchResult,

                didBat,
                runs: p.runs,
                balls: p.ballsFaced,
                fours: p.fours,
                sixes: p.sixes,
                isNotOut: didBat && !p.isOut,
                strikeRate: p.ballsFaced > 0 ? parseFloat(((p.runs / p.ballsFaced) * 100).toFixed(1)) : 0,

                didBowl,
                wickets: p.wickets,
                runsConceded: p.runsConceded,
                oversBowled: parseFloat(oversDecimal.toFixed(1)),
                economy: p.oversBowled > 0 ? parseFloat((p.runsConceded / (p.oversBowled / 6)).toFixed(2)) : 0,

                catches: p.catches,
                runOuts: p.runOuts,
                stumpings: p.stumpings,
            });
        });
    });

    return result;
}

// ─── Aggregate career stats from multiple match performances ────────────────

export function aggregateCareerStats(performances: PlayerMatchStats[]): Omit<CareerStats, 'name' | 'avatar' | 'playerId'> {
    const matchesPlayed = new Set(performances.map(p => p.matchId)).size;
    const battingInnings = performances.filter(p => p.didBat);
    const bowlingInnings = performances.filter(p => p.didBowl);

    const totalRuns = battingInnings.reduce((s, p) => s + p.runs, 0);
    const totalBalls = battingInnings.reduce((s, p) => s + p.balls, 0);
    const notOuts = battingInnings.filter(p => p.isNotOut).length;
    const fours = battingInnings.reduce((s, p) => s + p.fours, 0);
    const sixes = battingInnings.reduce((s, p) => s + p.sixes, 0);
    const fifties = battingInnings.filter(p => p.runs >= 50 && p.runs < 100).length;
    const hundreds = battingInnings.filter(p => p.runs >= 100).length;
    const highestScore = battingInnings.reduce((m, p) => Math.max(m, p.runs), 0);
    const dismissals = battingInnings.length - notOuts;
    const battingAverage = dismissals > 0 ? parseFloat((totalRuns / dismissals).toFixed(2)) : totalRuns;
    const strikeRate = totalBalls > 0 ? parseFloat(((totalRuns / totalBalls) * 100).toFixed(1)) : 0;

    const totalWickets = bowlingInnings.reduce((s, p) => s + p.wickets, 0);
    const totalBallsBowled = bowlingInnings.reduce((s, p) => s + Math.round(p.oversBowled * 6), 0);
    const totalRunsConceded = bowlingInnings.reduce((s, p) => s + p.runsConceded, 0);
    const fourFors = bowlingInnings.filter(p => p.wickets >= 4 && p.wickets < 5).length;
    const fiveFors = bowlingInnings.filter(p => p.wickets >= 5).length;
    const bowlingAverage = totalWickets > 0 ? parseFloat((totalRunsConceded / totalWickets).toFixed(2)) : 0;
    const economy = totalBallsBowled > 0 ? parseFloat((totalRunsConceded / (totalBallsBowled / 6)).toFixed(2)) : 0;

    // Best bowling: max wickets; among equal wickets, min runs
    let bestBowlingWickets = 0;
    let bestBowlingRuns = 999;
    bowlingInnings.forEach(p => {
        if (p.wickets > bestBowlingWickets || (p.wickets === bestBowlingWickets && p.runsConceded < bestBowlingRuns)) {
            bestBowlingWickets = p.wickets;
            bestBowlingRuns = p.runsConceded;
        }
    });

    const catches = performances.reduce((s, p) => s + p.catches, 0);
    const runOuts = performances.reduce((s, p) => s + p.runOuts, 0);
    const stumpings = performances.reduce((s, p) => s + p.stumpings, 0);

    return {
        matchesPlayed,
        inningsBatted: battingInnings.length,
        totalRuns,
        totalBalls,
        fours,
        sixes,
        fifties,
        hundreds,
        highestScore,
        notOuts,
        battingAverage,
        strikeRate,
        inningsBowled: bowlingInnings.length,
        totalWickets,
        ballsBowled: totalBallsBowled,
        runsConceded: totalRunsConceded,
        bowlingAverage,
        economy,
        fourFors,
        fiveFors,
        bestBowlingWickets,
        bestBowlingRuns,
        catches,
        runOuts,
        stumpings,
    };
}

// ─── Achievement Badges ───────────────────────────────────────────────────────

export interface Badge {
    id: string;
    label: string;
    icon: string;
    color: string;
}

export function getPlayerBadges(stats: Omit<CareerStats, 'name' | 'avatar' | 'playerId'>): Badge[] {
    const badges: Badge[] = [];
    if (stats.hundreds >= 1) badges.push({ id: 'centurion', label: 'Centurion', icon: '💯', color: 'bg-yellow-100 text-yellow-800' });
    if (stats.fifties >= 5) badges.push({ id: 'half_century_king', label: 'Half-Century King', icon: '5️⃣0️⃣', color: 'bg-blue-100 text-blue-800' });
    if (stats.fiveFors >= 1) badges.push({ id: 'five_fer', label: 'Five-For Hero', icon: '🎳', color: 'bg-purple-100 text-purple-800' });
    if (stats.totalWickets >= 50) badges.push({ id: 'wicket_machine', label: 'Wicket Machine', icon: '🏏', color: 'bg-red-100 text-red-800' });
    if (stats.totalRuns >= 500) badges.push({ id: 'run_machine', label: 'Run Machine', icon: '🔥', color: 'bg-orange-100 text-orange-800' });
    if (stats.catches >= 10) badges.push({ id: 'safe_hands', label: 'Safe Hands', icon: '🤲', color: 'bg-green-100 text-green-800' });
    if (stats.matchesPlayed >= 20) badges.push({ id: 'veteran', label: 'Veteran', icon: '⭐', color: 'bg-slate-100 text-slate-800' });
    if (stats.sixes >= 20) badges.push({ id: 'six_machine', label: 'Six Machine', icon: '💥', color: 'bg-pink-100 text-pink-800' });
    return badges;
}
