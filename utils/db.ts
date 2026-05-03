import { supabase } from './supabase';
import { socket, BACKEND_URL } from './socket';
import { Match, Series, PersistentTeam, CommunityPost, Notification } from '../types';
import { extractPlayerStatsFromMatch, aggregateCareerStats, CareerStats, PlayerMatchStats } from './playerStats';

// ─── User Profile ────────────────────────────────────────────────────────────

export interface DBUserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
    mobile_no?: string;
}

export async function loadProfile(userId: string): Promise<DBUserProfile | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/profile?userId=${userId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

export async function saveProfile(userId: string, profile: { name: string; email: string; avatar: string; mobileNo?: string }) {
    try {
        await fetch(`${BACKEND_URL}/api/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, profile })
        });
    } catch (e: any) { console.error('Error saving profile:', e.message); }
}

export async function loadProfileByMobile(mobileNo: string): Promise<DBUserProfile | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/profile/by-mobile/${mobileNo}`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function loadMatches(userId: string): Promise<Match[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/matches?userId=${userId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export async function saveMatch(userId: string, match: Match) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, match })
        });
        if (!res.ok) throw new Error('API Error');
    } catch (error: any) {
        console.error('Error saving match via REST:', error.message);
    }
}

export async function deleteMatch(matchId: string) {
    try {
        await fetch(`${BACKEND_URL}/api/match/${matchId}`, { method: 'DELETE' });
    } catch (e: any) { console.error('Error deleting match:', e.message); }
}

export async function deleteTournament(tournamentId: string) {
    try {
        await fetch(`${BACKEND_URL}/api/tournament/${tournamentId}`, { method: 'DELETE' });
    } catch (e: any) { console.error('Error deleting tournament:', e.message); }
}

// ─── Series ──────────────────────────────────────────────────────────────────

export async function loadActiveSeries(userId: string): Promise<Series | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/series/active?userId=${userId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

export async function loadCompletedSeries(userId: string): Promise<Series[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/series/completed?userId=${userId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export async function saveSeries(userId: string, series: Series) {
    try {
        await fetch(`${BACKEND_URL}/api/series`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, series })
        });
    } catch (e: any) { console.error('Error saving series:', e.message); }
}

export async function deleteActiveSeries(seriesId: string) {
    try {
        await fetch(`${BACKEND_URL}/api/series/${seriesId}/complete`, { method: 'PUT' });
    } catch (e: any) { console.error('Error updating series status:', e.message); }
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export async function loadTeams(userId: string): Promise<PersistentTeam[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/teams?userId=${userId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export async function saveTeam(userId: string, team: PersistentTeam) {
    try {
        await fetch(`${BACKEND_URL}/api/team`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, team })
        });
    } catch (e: any) { console.error('Error saving team:', e.message); }
}

export async function deleteTeam(teamId: string) {
    try {
        await fetch(`${BACKEND_URL}/api/team/${teamId}`, { method: 'DELETE' });
    } catch (e: any) { console.error('Error deleting team:', e.message); }
}

export async function joinTeam(teamId: string, profile: { id: string, name: string, avatar: string, mobileNo?: string }) {
    try {
        await fetch(`${BACKEND_URL}/api/team/${teamId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile })
        });
    } catch (e: any) { console.error('Error joining team:', e.message); }
}

// ─── Players ──────────────────────────────────────────────────────────────────

export interface DBPlayer {
    id: string; // normalized name key
    user_id: string;
    name: string;
    avatar?: string;
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
    innings_bowled: number;
    total_wickets: number;
    balls_bowled: number;
    runs_conceded: number;
    four_fors: number;
    five_fors: number;
    best_bowling_wickets: number;
    best_bowling_runs: number;
    catches: number;
    run_outs: number;
    stumpings: number;
    updated_at: string;
}

export async function syncPlayersFromMatches(userId: string, allMatches: Match[]) {
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
            id, user_id: userId, name, avatar,
            matches_played: stats.matchesPlayed, innings_batted: stats.inningsBatted, total_runs: stats.totalRuns, total_balls: stats.totalBalls, fours: stats.fours, sixes: stats.sixes, fifties: stats.fifties, hundreds: stats.hundreds, highest_score: stats.highestScore, not_outs: stats.notOuts, innings_bowled: stats.inningsBowled, total_wickets: stats.totalWickets, balls_bowled: stats.ballsBowled, runs_conceded: stats.runsConceded, four_fors: stats.fourFors, five_fors: stats.fiveFors, best_bowling_wickets: stats.bestBowlingWickets, best_bowling_runs: stats.bestBowlingRuns, catches: stats.catches, run_outs: stats.runOuts, stumpings: stats.stumpings, updated_at: new Date().toISOString(),
        });
    });

    if (upsertRows.length === 0) return;
    try {
        await fetch(`${BACKEND_URL}/api/players/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upsertRows })
        });
    } catch (e: any) { console.error('Error syncing players:', e.message); }
}

export async function loadAllPlayers(userId: string): Promise<DBPlayer[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/players?userId=${userId}`);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
    } catch (e) { return []; }
}

export async function loadPlayerById(userId: string, playerId: string): Promise<DBPlayer | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/player/${playerId}?userId=${userId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

// ─── Tournaments ──────────────────────────────────────────────────────────────

import { Tournament } from '../types';

export async function saveTournament(userId: string, tournament: Tournament) {
    try {
        await fetch(`${BACKEND_URL}/api/tournament`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, tournament })
        });
    } catch (e: any) { console.error('Error saving tournament:', e.message); }
}

export async function loadTournaments(userId: string): Promise<Tournament[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tournaments?userId=${userId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

// ─── Live Match Score (Public) ────────────────────────────────────────────────

export async function pushLiveScore(matchId: string, userId: string, matchData: Match) {
    socket.emit('push_score_update', { matchId, matchData, userId });
}

export async function loadLiveScore(matchId: string): Promise<Match | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/live/${matchId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch { return null; }
}

export async function removeLiveScore(matchId: string) {
    try {
        await fetch(`${BACKEND_URL}/api/live/${matchId}`, { method: 'DELETE' });
    } catch (e: any) { console.error('Error removing live score:', e.message); }
}

// ─── Community Posts & Notifications ─────────────────────────────────────

export async function loadCommunityPosts(): Promise<CommunityPost[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/community`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export async function saveCommunityPost(post: CommunityPost) {
    try {
        await fetch(`${BACKEND_URL}/api/community`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post })
        });
    } catch (e: any) { console.error('Error saving post:', e.message); }
}

export async function updatePostStatus(postId: string, status: 'OPEN' | 'ACCEPTED') {
    try {
        await fetch(`${BACKEND_URL}/api/community/${postId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    } catch (e: any) { console.error('Error updating post status:', e.message); }
}

export async function loadNotifications(userId: string): Promise<Notification[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/notifications?userId=${userId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

export async function saveNotification(notification: Notification) {
    try {
        await fetch(`${BACKEND_URL}/api/notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification })
        });
    } catch (e: any) { console.error('Error saving notification:', e.message); }
}

export async function markNotificationRead(notificationId: string) {
    try {
        await fetch(`${BACKEND_URL}/api/notification/${notificationId}/read`, { method: 'PUT' });
    } catch (e: any) { console.error('Error logging notification read:', e.message); }
}
