import React, { useState } from 'react';
import { DBPlayer } from '../utils/db';
import { Match } from '../types';
import { getPlayerBadges, extractPlayerStatsFromMatch, normalizePlayerName } from '../utils/playerStats';
import { formatOvers } from '../utils/cricketLogic';
import {
    ArrowLeft, Trophy, Target, Wind, Star, Shield,
    TrendingUp, Activity, Award, Zap, User
} from 'lucide-react';

interface PlayerProfileViewProps {
    player: DBPlayer;
    allMatches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
}

const StatsCard = ({ title, icon: Icon, color, children }: {
    title: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`flex items-center gap-2 px-5 py-3 ${color}`}>
            <Icon className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wider">{title}</span>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const StatRow = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className={`flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 ${highlight ? 'font-bold' : ''}`}>
        <span className="text-gray-500 text-sm">{label}</span>
        <span className={`font-bold text-sm ${highlight ? 'text-accent text-base' : 'text-gray-900'}`}>{value}</span>
    </div>
);

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
    player, allMatches, onBack, onMatchClick
}) => {
    const [tab, setTab] = useState<'BATTING' | 'BOWLING' | 'FIELDING' | 'MATCHES'>('BATTING');

    const battingAvg = (player.innings_batted - player.not_outs) > 0
        ? (player.total_runs / (player.innings_batted - player.not_outs)).toFixed(2)
        : player.total_runs.toString();
    const strikeRate = player.total_balls > 0
        ? ((player.total_runs / player.total_balls) * 100).toFixed(1)
        : '0.0';
    const economy = player.balls_bowled > 0
        ? (player.runs_conceded / (player.balls_bowled / 6)).toFixed(2)
        : '0.00';
    const bowlingAvg = player.total_wickets > 0
        ? (player.runs_conceded / player.total_wickets).toFixed(2)
        : '-';
    const bowlingBest = player.best_bowling_wickets > 0
        ? `${player.best_bowling_wickets}/${player.best_bowling_runs}`
        : '-';

    const badges = getPlayerBadges({
        matchesPlayed: player.matches_played, inningsBatted: player.innings_batted,
        totalRuns: player.total_runs, totalBalls: player.total_balls, fours: player.fours, sixes: player.sixes,
        fifties: player.fifties, hundreds: player.hundreds, highestScore: player.highest_score, notOuts: player.not_outs,
        battingAverage: 0, strikeRate: 0, inningsBowled: player.innings_bowled,
        totalWickets: player.total_wickets, ballsBowled: player.balls_bowled, runsConceded: player.runs_conceded,
        bowlingAverage: 0, economy: 0, fourFors: player.four_fors, fiveFors: player.five_fors,
        bestBowlingWickets: player.best_bowling_wickets, bestBowlingRuns: player.best_bowling_runs,
        catches: player.catches, runOuts: player.run_outs, stumpings: player.stumpings,
    });

    const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const normalizedId = normalizePlayerName(player.name);

    // Get matches this player appeared in
    const playerMatches = allMatches.filter(m =>
        [...m.teamA.players, ...m.teamB.players].some(p => normalizePlayerName(p.name) === normalizedId)
    );

    const tabs = ['BATTING', 'BOWLING', 'FIELDING', 'MATCHES'] as const;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
            {/* Back button */}
            <button onClick={onBack}
                className="flex items-center gap-2 text-gray-500 hover:text-accent font-medium mb-6 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                All Players
            </button>

            {/* Hero card */}
            <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-3xl overflow-hidden mb-6 shadow-2xl">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }} />

                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-30" />
                            <div className="relative w-28 h-28 rounded-full border-4 border-yellow-400/60 overflow-hidden shadow-2xl">
                                {player.avatar ? (
                                    <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl">
                                        {initials}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-black text-white mb-1">{player.name}</h1>
                            <p className="text-blue-300 font-medium mb-3">{player.matches_played} Matches Played</p>

                            {/* Quick stats bar */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {[
                                    { label: 'Runs', value: player.total_runs, color: 'text-yellow-300' },
                                    { label: 'Avg', value: battingAvg, color: 'text-green-300' },
                                    { label: 'SR', value: strikeRate, color: 'text-blue-300' },
                                    { label: 'Wkts', value: player.total_wickets, color: 'text-red-300' },
                                    { label: 'Eco', value: economy, color: 'text-purple-300' },
                                    { label: 'Catch', value: player.catches, color: 'text-orange-300' },
                                ].map(s => (
                                    <div key={s.label} className="text-center bg-white/5 rounded-xl p-2 border border-white/10">
                                        <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                                        <div className="text-white/50 text-[10px] font-semibold uppercase">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Badges */}
                    {badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-5">
                            {badges.map(b => (
                                <span key={b.id} className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white text-xs font-bold">
                                    {b.icon} {b.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-6 gap-1">
                {tabs.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {t === 'BATTING' ? '🏏 Batting' : t === 'BOWLING' ? '🎳 Bowling' : t === 'FIELDING' ? '🤲 Fielding' : '📋 Matches'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'BATTING' && (
                <StatsCard title="Batting Statistics" icon={TrendingUp} color="bg-blue-50 text-blue-800">
                    <StatRow label="Matches" value={player.matches_played} />
                    <StatRow label="Innings" value={player.innings_batted} />
                    <StatRow label="Not Outs" value={player.not_outs} />
                    <StatRow label="Runs" value={player.total_runs} highlight />
                    <StatRow label="Highest Score" value={player.highest_score} highlight />
                    <StatRow label="Average" value={battingAvg} highlight />
                    <StatRow label="Strike Rate" value={strikeRate} />
                    <StatRow label="Fours (4s)" value={player.fours} />
                    <StatRow label="Sixes (6s)" value={player.sixes} />
                    <div className="flex gap-4 mt-4">
                        <div className="flex-1 bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
                            <div className="text-3xl font-black text-yellow-700">{player.fifties}</div>
                            <div className="text-yellow-600 text-sm font-bold mt-1">Half Centuries (50s)</div>
                        </div>
                        <div className="flex-1 bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                            <div className="text-3xl font-black text-orange-700">{player.hundreds}</div>
                            <div className="text-orange-600 text-sm font-bold mt-1">Centuries (100s)</div>
                        </div>
                    </div>
                </StatsCard>
            )}

            {tab === 'BOWLING' && (
                <StatsCard title="Bowling Statistics" icon={Target} color="bg-red-50 text-red-800">
                    <StatRow label="Innings Bowled" value={player.innings_bowled} />
                    <StatRow label="Overs" value={formatOvers(player.balls_bowled)} />
                    <StatRow label="Runs Conceded" value={player.runs_conceded} />
                    <StatRow label="Wickets" value={player.total_wickets} highlight />
                    <StatRow label="Average" value={bowlingAvg} highlight />
                    <StatRow label="Economy Rate" value={economy} highlight />
                    <StatRow label="Best Bowling" value={bowlingBest} highlight />
                    <div className="flex gap-4 mt-4">
                        <div className="flex-1 bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                            <div className="text-3xl font-black text-purple-700">{player.four_fors}</div>
                            <div className="text-purple-600 text-sm font-bold mt-1">4-Wicket Hauls</div>
                        </div>
                        <div className="flex-1 bg-red-50 rounded-xl p-4 text-center border border-red-100">
                            <div className="text-3xl font-black text-red-700">{player.five_fors}</div>
                            <div className="text-red-600 text-sm font-bold mt-1">5-Wicket Hauls</div>
                        </div>
                    </div>
                </StatsCard>
            )}

            {tab === 'FIELDING' && (
                <StatsCard title="Fielding Statistics" icon={Shield} color="bg-green-50 text-green-800">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded-2xl p-5 text-center border border-green-100">
                            <div className="text-4xl font-black text-green-700">{player.catches}</div>
                            <div className="text-green-600 text-sm font-bold mt-2">🤲 Catches</div>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-5 text-center border border-blue-100">
                            <div className="text-4xl font-black text-blue-700">{player.run_outs}</div>
                            <div className="text-blue-600 text-sm font-bold mt-2">🎯 Run Outs</div>
                        </div>
                        <div className="bg-purple-50 rounded-2xl p-5 text-center border border-purple-100">
                            <div className="text-4xl font-black text-purple-700">{player.stumpings}</div>
                            <div className="text-purple-600 text-sm font-bold mt-2">🧤 Stumpings</div>
                        </div>
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-gray-700">{player.catches + player.run_outs + player.stumpings}</div>
                        <div className="text-gray-500 text-sm font-semibold mt-1">Total Fielding Contributions</div>
                    </div>
                </StatsCard>
            )}

            {tab === 'MATCHES' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-700">
                        <Activity className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Match History ({playerMatches.length})</span>
                    </div>
                    {playerMatches.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No match history available</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {playerMatches.slice(0, 20).map(m => {
                                const pTeam = m.teamA.players.some(p => normalizePlayerName(p.name) === normalizedId) ? m.teamA : m.teamB;
                                const oppTeam = pTeam.id === m.teamA.id ? m.teamB : m.teamA;
                                const pObj = pTeam.players.find(p => normalizePlayerName(p.name) === normalizedId);
                                const won = m.winningTeamId === pTeam.id;
                                const resultColor = !m.winningTeamId ? 'text-gray-500' : won ? 'text-green-600' : 'text-red-500';
                                const resultLabel = !m.winningTeamId ? 'DRAW' : won ? 'WON' : 'LOST';

                                return (
                                    <div key={m.id} onClick={() => onMatchClick(m)}
                                        className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{pTeam.name} vs {oppTeam.name}</div>
                                            <div className="text-gray-400 text-xs mt-0.5">{new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            {pObj && (
                                                <>
                                                    {pObj.ballsFaced > 0 && (
                                                        <div className="text-center">
                                                            <div className="font-black text-blue-700">{pObj.runs}{pObj.isOut ? '' : '*'}</div>
                                                            <div className="text-gray-400 text-[10px]">{pObj.ballsFaced}b</div>
                                                        </div>
                                                    )}
                                                    {pObj.oversBowled > 0 && (
                                                        <div className="text-center">
                                                            <div className="font-black text-red-600">{pObj.wickets}/{pObj.runsConceded}</div>
                                                            <div className="text-gray-400 text-[10px]">{formatOvers(pObj.oversBowled)} ov</div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <span className={`font-black text-xs ${resultColor}`}>{resultLabel}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
