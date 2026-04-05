import { supabase } from './supabase';
import { Match, Series, PersistentTeam } from '../types';
import { extractPlayerStatsFromMatch, aggregateCareerStats, normalizePlayerName, CareerStats, PlayerMatchStats } from './playerStats';

// ─── User Profile ────────────────────────────────────────────────────────────

export interface DBUserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

export async function loadProfile(userId: string): Promise<DBUserProfile | null> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error || !data) return null;
    return data as DBUserProfile;
}

export async function saveProfile(userId: string, profile: { name: string; email: string; avatar: string }) {
    const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() });
    if (error) console.error('Error saving profile:', error.message);
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function loadMatches(userId: string): Promise<Match[]> {
    const { data, error } = await supabase
        .from('matches')
        .select('data')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error || !data) return [];
    return data.map((row: { data: Match }) => row.data);
}

export async function saveMatch(userId: string, match: Match) {
    const { error } = await supabase
        .from('matches')
        .upsert({ id: match.id, user_id: userId, data: match, date: match.date });
    if (error) console.error('Error saving match:', error.message);
}

export async function deleteMatch(matchId: string) {
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);
    if (error) console.error('Error deleting match:', error.message);
}

export async function deleteTournament(tournamentId: string) {
    const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);
    if (error) console.error('Error deleting tournament:', error.message);
}

// ─── Series ──────────────────────────────────────────────────────────────────

export async function loadActiveSeries(userId: string): Promise<Series | null> {
    const { data, error } = await supabase
        .from('series')
        .select('data')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error || !data) return null;
    return (data as { data: Series }).data;
}

export async function loadCompletedSeries(userId: string): Promise<Series[]> {
    const { data, error } = await supabase
        .from('series')
        .select('data')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: { data: Series }) => row.data);
}

export async function saveSeries(userId: string, series: Series) {
    const { error } = await supabase
        .from('series')
        .upsert({
            id: series.id,
            user_id: userId,
            data: series,
            status: series.status,
        });
    if (error) console.error('Error saving series:', error.message);
}

export async function deleteActiveSeries(seriesId: string) {
    const { error } = await supabase
        .from('series')
        .update({ status: 'COMPLETED' })
        .eq('id', seriesId);
    if (error) console.error('Error updating series status:', error.message);
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export async function loadTeams(userId: string): Promise<PersistentTeam[]> {
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    
    return data.map(row => ({
        id: row.id,
        name: row.name,
        logoUrl: row.logo_url,
        roster: row.roster || []
    }));
}

export async function saveTeam(userId: string, team: PersistentTeam) {
    const { error } = await supabase
        .from('teams')
        .upsert({ 
            id: team.id, 
            user_id: userId, 
            name: team.name,
            logo_url: team.logoUrl || null,
            roster: team.roster,
            updated_at: new Date().toISOString()
        });
    if (error) console.error('Error saving team:', error.message);
}

export async function deleteTeam(teamId: string) {
    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
    if (error) console.error('Error deleting team:', error.message);
}


// ─── Players ──────────────────────────────────────────────────────────────────

export interface DBPlayer {
    id: string;         // normalized name key
    user_id: string;
    name: string;
    avatar?: string;
    // Batting
    matches_played: number;
    innings_batted: number;
    total_runs: number;
    total_balls: number;
    fours: number;
    sixes: number;
    fifties: number;
    hundreds: number;
    highest_score: number;
    not_outs: number;
    // Bowling
    innings_bowled: number;
    total_wickets: number;
    balls_bowled: number;
    runs_conceded: number;
    four_fors: number;
    five_fors: number;
    best_bowling_wickets: number;
    best_bowling_runs: number;
    // Fielding
    catches: number;
    run_outs: number;
    stumpings: number;
    updated_at: string;
}

/** Rebuild all player stats from the full match history and sync to Supabase */
export async function syncPlayersFromMatches(userId: string, allMatches: Match[]) {
    // Collect all performances per player (by normalized name)
    const playerPerformances: Record<string, { performances: ReturnType<typeof extractPlayerStatsFromMatch>[0][], name: string, avatar?: string }> = {};

    allMatches.forEach(match => {
        const perfs = extractPlayerStatsFromMatch(match);
        perfs.forEach(perf => {
            if (!playerPerformances[perf.playerId_name]) {
                playerPerformances[perf.playerId_name] = { performances: [], name: perf.name, avatar: perf.avatar };
            }
            playerPerformances[perf.playerId_name].performances.push(perf);
            if (perf.avatar && !playerPerformances[perf.playerId_name].avatar) {
                playerPerformances[perf.playerId_name].avatar = perf.avatar;
            }
        });
    });

    const upsertRows: DBPlayer[] = [];
    Object.entries(playerPerformances).forEach(([id, { performances, name, avatar }]) => {
        const stats = aggregateCareerStats(performances);
        upsertRows.push({
            id,
            user_id: userId,
            name,
            avatar,
            matches_played: stats.matchesPlayed,
            innings_batted: stats.inningsBatted,
            total_runs: stats.totalRuns,
            total_balls: stats.totalBalls,
            fours: stats.fours,
            sixes: stats.sixes,
            fifties: stats.fifties,
            hundreds: stats.hundreds,
            highest_score: stats.highestScore,
            not_outs: stats.notOuts,
            innings_bowled: stats.inningsBowled,
            total_wickets: stats.totalWickets,
            balls_bowled: stats.ballsBowled,
            runs_conceded: stats.runsConceded,
            four_fors: stats.fourFors,
            five_fors: stats.fiveFors,
            best_bowling_wickets: stats.bestBowlingWickets,
            best_bowling_runs: stats.bestBowlingRuns,
            catches: stats.catches,
            run_outs: stats.runOuts,
            stumpings: stats.stumpings,
            updated_at: new Date().toISOString(),
        });
    });

    if (upsertRows.length === 0) return;
    const { error } = await supabase.from('players').upsert(upsertRows);
    if (error) console.error('Error syncing players:', error.message);
}

export async function loadAllPlayers(userId: string): Promise<DBPlayer[]> {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .order('total_runs', { ascending: false });
    if (error || !data) return [];
    return data as DBPlayer[];
}

export async function loadPlayerById(userId: string, playerId: string): Promise<DBPlayer | null> {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .eq('user_id', userId)
        .single();
    if (error || !data) return null;
    return data as DBPlayer;
}

// ─── Tournaments ──────────────────────────────────────────────────────────────

import { Tournament } from '../types';

export async function saveTournament(userId: string, tournament: Tournament) {
    const { error } = await supabase
        .from('tournaments')
        .upsert({ id: tournament.id, user_id: userId, data: tournament, status: tournament.status });
    if (error) console.error('Error saving tournament:', error.message);
}

export async function loadTournaments(userId: string): Promise<Tournament[]> {
    const { data, error } = await supabase
        .from('tournaments')
        .select('data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: { data: Tournament }) => row.data);
}

// ─── Live Match Score (Public) ────────────────────────────────────────────────\n
export async function pushLiveScore(matchId: string, userId: string, matchData: Match) {
    const snapshot = {
        id: matchId,
        user_id: userId,
        match_data: matchData,
        updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
        .from('live_matches')
        .upsert(snapshot, { onConflict: 'id' });
    if (error) console.error('Error pushing live score:', error.message);
}

export async function loadLiveScore(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
        .from('live_matches')
        .select('match_data')
        .eq('id', matchId)
        .single();
    if (error || !data) return null;
    return data.match_data as Match;
}

export async function removeLiveScore(matchId: string) {
    await supabase.from('live_matches').delete().eq('id', matchId);
}

