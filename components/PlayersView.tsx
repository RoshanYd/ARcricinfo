import React, { useState } from 'react';
import { DBPlayer } from '../utils/db';
import { getPlayerBadges, aggregateCareerStats } from '../utils/playerStats';
import { Search, Users, Trophy, Target, Wind, Star, TrendingUp, ArrowUpDown } from 'lucide-react';

interface PlayersViewProps {
    players: DBPlayer[];
    onPlayerClick: (player: DBPlayer) => void;
    isLoading: boolean;
}

type SortKey = 'total_runs' | 'total_wickets' | 'matches_played' | 'hundreds' | 'catches';

const StatPill = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${color}`}>
        <span className="text-lg font-black">{value}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
    </div>
);

const PlayerCard: React.FC<{ player: DBPlayer; onClick: () => void; rank?: number; rankLabel?: string }> = ({ player, onClick, rank, rankLabel }) => {
    const battingAvg = player.innings_batted > player.not_outs
        ? (player.total_runs / (player.innings_batted - player.not_outs)).toFixed(1)
        : player.total_runs.toString();
    const bowlingAvg = player.total_wickets > 0
        ? (player.runs_conceded / player.total_wickets).toFixed(1)
        : '-';
    const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const badges = getPlayerBadges({
        matchesPlayed: player.matches_played,
        inningsBatted: player.innings_batted,
        totalRuns: player.total_runs,
        totalBalls: player.total_balls,
        fours: player.fours,
        sixes: player.sixes,
        fifties: player.fifties,
        hundreds: player.hundreds,
        highestScore: player.highest_score,
        notOuts: player.not_outs,
        battingAverage: 0, strikeRate: 0,
        inningsBowled: player.innings_bowled,
        totalWickets: player.total_wickets,
        ballsBowled: player.balls_bowled,
        runsConceded: player.runs_conceded,
        bowlingAverage: 0, economy: 0,
        fourFors: player.four_fors,
        fiveFors: player.five_fors,
        bestBowlingWickets: player.best_bowling_wickets,
        bestBowlingRuns: player.best_bowling_runs,
        catches: player.catches,
        runOuts: player.run_outs,
        stumpings: player.stumpings,
    });

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
        >
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-4 flex items-center gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                
                {/* Ranking Badge */}
                {rank && (
                    <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-black text-xl px-3 outline outline-2 outline-white py-1 rounded-bl-xl shadow-lg flex flex-col items-center">
                            #{rank}
                            {rankLabel && <span className="text-[9px] uppercase tracking-widest opacity-90 leading-none mb-0.5">{rankLabel}</span>}
                        </div>
                    </div>
                )}

                <div className="relative z-10 w-14 h-14 rounded-full border-2 border-yellow-400/70 overflow-hidden flex-shrink-0 shadow-lg mt-2">
                    {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                            {initials}
                        </div>
                    )}
                </div>
                <div className="relative z-10 flex-1 min-w-0">
                    <h3 className="font-black text-white text-base leading-tight truncate">{player.name}</h3>
                    <p className="text-blue-300 text-xs font-medium mt-0.5">{player.matches_played} Matches</p>
                    {/* Badges */}
                    {badges.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                            {badges.slice(0, 2).map(b => (
                                <span key={b.id} className="text-xs bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-full px-1.5 py-0.5 font-semibold">
                                    {b.icon}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-4 grid grid-cols-3 gap-2">
                <StatPill label="Runs" value={player.total_runs} color="bg-blue-50 text-blue-800" />
                <StatPill label="Avg" value={battingAvg} color="bg-green-50 text-green-800" />
                <StatPill label="HS" value={player.highest_score} color="bg-yellow-50 text-yellow-800" />
                <StatPill label="Wkts" value={player.total_wickets} color="bg-red-50 text-red-800" />
                <StatPill label="Econ" value={player.innings_bowled > 0 && player.balls_bowled > 0 ? (player.runs_conceded / (player.balls_bowled / 6)).toFixed(1) : '-'} color="bg-purple-50 text-purple-800" />
                <StatPill label="Ctch" value={player.catches} color="bg-orange-50 text-orange-800" />
            </div>

            {/* Milestones Footer */}
            <div className="px-4 pb-4 flex items-center gap-3 text-xs font-semibold text-gray-500">
                {player.hundreds > 0 && <span className="flex items-center gap-1"><span className="text-yellow-500">💯</span>{player.hundreds} 100s</span>}
                {player.fifties > 0 && <span className="flex items-center gap-1"><span>5️⃣0️⃣</span>{player.fifties} 50s</span>}
                {player.five_fors > 0 && <span className="flex items-center gap-1"><span className="text-red-500">🎳</span>{player.five_fors} 5W</span>}
            </div>
        </div>
    );
};

export const PlayersView: React.FC<PlayersViewProps> = ({ players, onPlayerClick, isLoading }) => {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('total_runs');

    const sortOptions: { key: SortKey; label: string }[] = [
        { key: 'total_runs', label: 'Runs' },
        { key: 'total_wickets', label: 'Wickets' },
        { key: 'matches_played', label: 'Matches' },
        { key: 'hundreds', label: '100s' },
        { key: 'catches', label: 'Catches' },
    ];

    const filtered = players
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-black text-accent flex items-center gap-3">
                        <Users className="w-8 h-8" /> Players
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{players.length} players registered</p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search player..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-accent transition-colors bg-white text-gray-900 font-medium placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Sort Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mr-1 shrink-0">
                    <ArrowUpDown className="w-3 h-3" /> Sort:
                </span>
                {sortOptions.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setSortKey(opt.key)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${sortKey === opt.key
                            ? 'bg-accent text-white shadow-lg'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Players Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Loading players...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                        {search ? 'No players found' : 'No Players Yet'}
                    </h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                        {search
                            ? `No player named "${search}" found.`
                            : 'Player profiles are automatically created when you complete a match.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((player, index) => (
                        <PlayerCard 
                            key={player.id} 
                            player={player} 
                            onClick={() => onPlayerClick(player)} 
                            rank={index + 1}
                            rankLabel={sortOptions.find(o => o.key === sortKey)?.label}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
