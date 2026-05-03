import React, { useEffect, useState } from 'react';
import { Match, MatchStatus, ExtraType } from '../types';
import { loadLiveScore } from '../utils/db';

interface BroadcastOverlayProps {
    matchId: string;
}

export const BroadcastOverlay: React.FC<BroadcastOverlayProps> = ({ matchId }) => {
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial fetch + Socket connection
    useEffect(() => {
        loadLiveScore(matchId).then(m => {
            if (m) setMatch(m);
            setLoading(false);
        });

        // Realtime subscription via Socket.io
        let unsubscribe = () => {};
        import('../utils/socket').then(({ socket }) => {
            socket.emit('join_match', matchId);

            const handleUpdate = (updatedMatch: Match) => {
                setMatch(updatedMatch);
            };

            socket.on('match_state_updated', handleUpdate);

            unsubscribe = () => {
                socket.off('match_state_updated', handleUpdate);
            };
        });

        return () => unsubscribe();
    }, [matchId]);

    if (loading || !match) {
        return null; // Don't render anything in OBS while loading
    }

    const battingTeam = match.teamA.isBatting ? match.teamA : match.teamB;
    const bowlingTeam = match.teamA.isBatting ? match.teamB : match.teamA;
    const isSuperOver = match.currentInnings > 2;

    const currentRuns = isSuperOver ? battingTeam.superOverRuns : battingTeam.totalRuns;
    const currentWickets = isSuperOver ? battingTeam.superOverWickets : battingTeam.wickets;
    const currentOvers = isSuperOver ? battingTeam.superOverBalls : battingTeam.overs;

    const striker = battingTeam.players.find(p => p.id === match.currentStrikerId);
    const nonStriker = battingTeam.players.find(p => p.id === match.currentNonStrikerId);
    const bowler = bowlingTeam.players.find(p => p.id === match.currentBowlerId);

    // Target info
    const isSecondInnings = match.currentInnings === 2 || match.currentInnings === 4;
    let targetMsg = '';
    if (isSecondInnings) {
        const target = (match.currentInnings === 2 ? bowlingTeam.totalRuns : bowlingTeam.superOverRuns) + 1;
        const remaining = target - currentRuns;
        const ballsLeft = (match.totalOvers * 6) - currentOvers;
        targetMsg = `NEED ${remaining} RUNS FROM ${ballsLeft} BALLS`;
    }

    // Recent balls
    const recentBalls = match.balls.slice(-10).map(b => {
        if (b.isWicket) return 'W';
        if (b.extraType === ExtraType.WIDE) return `${b.runsScored}wd`;
        if (b.extraType === ExtraType.NO_BALL) return `${b.runsScored}nb`;
        return String(b.runsScored);
    });

    const oversStr = `${Math.floor(currentOvers / 6)}.${currentOvers % 6}`;

    return (
        <div className="w-screen h-screen bg-transparent overflow-hidden relative font-sans">
            {/* The Lower Third Container */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 transition-all duration-500 transform translate-y-0 text-white">
                
                {/* Optional Status Message or Target */}
                {targetMsg && !match.winningTeamId && (
                    <div className="w-fit mb-2 bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-1 font-bold text-black text-sm uppercase tracking-widest shadow-md flex items-center rounded-r-md">
                        <span className="w-2 h-2 bg-black rounded-full mr-2 animate-pulse"></span>
                        {targetMsg}
                    </div>
                )}
                {match.status === MatchStatus.COMPLETED && (
                    <div className="w-fit mb-2 bg-gradient-to-r from-red-600 to-red-700 px-4 py-1 font-bold text-white text-sm uppercase tracking-widest shadow-md flex items-center rounded-r-md">
                        MATCH COMPLETED
                    </div>
                )}

                {/* Main Score Bar */}
                <div className="flex items-stretch mx-auto w-full h-16 shadow-2xl rounded overflow-hidden">
                    {/* Team Block */}
                    <div className="w-1/4 bg-gradient-to-br from-indigo-900 to-blue-950 flex flex-col items-center justify-center border-r-4 border-yellow-400 p-2">
                        <div className="font-black text-2xl tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                            {battingTeam.name.substring(0, 3)}
                        </div>
                        {isSuperOver && <div className="text-[10px] text-yellow-400 leading-none uppercase font-bold tracking-widest mt-1">Super Over</div>}
                    </div>

                    {/* Score Block */}
                    <div className="flex-1 bg-gradient-to-b from-gray-800 to-black flex items-center justify-center px-4">
                        <span className="text-5xl font-black text-yellow-500 leading-none pr-1">
                            {currentRuns}
                        </span>
                        <span className="text-3xl font-black text-gray-400 leading-none">
                            /{currentWickets}
                        </span>
                        <span className="text-xl font-bold text-gray-300 ml-4 border-l border-gray-600 pl-4 py-1">
                            {oversStr}
                            <span className="text-sm font-normal text-gray-500 ml-1">ov</span>
                        </span>
                    </div>

                    {/* Batter Block */}
                    <div className="w-1/3 bg-gray-900 bg-opacity-95 flex flex-col justify-center px-4 border-l border-gray-700">
                        {striker && (
                            <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-yellow-400 whitespace-nowrap overflow-hidden text-ellipsis mr-2 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></span>
                                    {striker.name.split(' ')[0]} {/* First name or short */}
                                </span>
                                <span className="font-bold">
                                    {isSuperOver ? striker.superOverStats?.runs ?? 0 : striker.runs}
                                    <span className="text-xs text-gray-400 ml-1">
                                        ({isSuperOver ? striker.superOverStats?.ballsFaced ?? 0 : striker.ballsFaced})
                                    </span>
                                </span>
                            </div>
                        )}
                        {nonStriker && (
                            <div className="flex justify-between items-center w-full mt-0.5">
                                <span className="font-medium text-gray-400 text-sm whitespace-nowrap overflow-hidden text-ellipsis mr-2 px-3.5">
                                    {nonStriker.name.split(' ')[0]}
                                </span>
                                <span className="font-medium text-gray-400 text-sm">
                                    {isSuperOver ? nonStriker.superOverStats?.runs ?? 0 : nonStriker.runs}
                                    <span className="text-[10px] ml-1">
                                        ({isSuperOver ? nonStriker.superOverStats?.ballsFaced ?? 0 : nonStriker.ballsFaced})
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bowler Block */}
                    <div className="w-[15%] min-w-[200px] bg-gradient-to-r from-indigo-950 to-blue-900 flex flex-col justify-center px-4 text-sm border-l border-indigo-500 border-opacity-50">
                        {bowler && (
                            <>
                                <div className="text-indigo-200 font-bold uppercase tracking-wider text-[10px] mb-0.5">Bowler</div>
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-white whitespace-nowrap text-ellipsis overflow-hidden mr-2">
                                        {bowler.name.split(' ')[0]}
                                    </span>
                                    <span className="font-black text-white text-base leading-none tracking-wide">
                                        {Math.floor((isSuperOver ? bowler.superOverStats?.oversBowled ?? 0 : bowler.oversBowled) / 6)}.{(isSuperOver ? bowler.superOverStats?.oversBowled ?? 0 : bowler.oversBowled) % 6}-
                                        {isSuperOver ? bowler.superOverStats?.runsConceded ?? 0 : bowler.runsConceded}-
                                        {isSuperOver ? bowler.superOverStats?.wickets ?? 0 : bowler.wickets}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Sub-bar: Recent Balls */}
                {!match.winningTeamId && (
                    <div className="flex mt-1 mx-auto w-full items-center pl-2">
                        <div className="bg-blue-900 text-blue-100 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 mr-1 rounded shadow h-fit">
                            Recent
                        </div>
                        <div className="flex gap-1 overflow-visible">
                            {recentBalls.map((ball, i) => (
                                <div key={i} className={`flex items-center justify-center min-w-[24px] h-6 rounded text-xs font-black px-1.5 shadow-md ${
                                    ball === 'W' ? 'bg-red-600 text-white' :
                                    ball === '4' ? 'bg-blue-500 text-white border-b-2 border-blue-700' :
                                    ball === '6' ? 'bg-indigo-600 text-white border-b-2 border-indigo-800' :
                                    ball === '0' ? 'bg-gray-800 text-gray-400' :
                                    'bg-gray-700 text-gray-200'
                                }`}>
                                    {ball}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
