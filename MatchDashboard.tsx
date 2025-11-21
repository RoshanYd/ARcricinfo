import React, { useState } from 'react';
import { Match, Team, Player, DismissalType } from '../types';
import { formatOvers, calculateEconomy, calculateStrikeRate, getProjectedScore, getDismissalText } from '../utils/cricketLogic';
import { Trophy, Activity, Wind, Target, ClipboardList, BarChart2, User } from 'lucide-react';

interface DashboardProps {
  match: Match;
}

export const MatchDashboard: React.FC<DashboardProps> = ({ match }) => {
  const [viewMode, setViewMode] = useState<'LIVE' | 'SCORECARD'>('LIVE');
  const [scorecardInnings, setScorecardInnings] = useState<number>(match.currentInnings);

  // Ensure scorecard defaults to current innings when match updates phases
  React.useEffect(() => {
    setScorecardInnings(match.currentInnings);
  }, [match.currentInnings]);

  const battingTeam = match.currentInnings === 1 
    ? (match.teamA.isBatting ? match.teamA : match.teamB)
    : (match.teamA.isBatting ? match.teamA : match.teamB);
    
  const bowlingTeam = match.currentInnings === 1
    ? (match.teamA.isBatting ? match.teamB : match.teamA)
    : (match.teamA.isBatting ? match.teamB : match.teamA);

  const striker = battingTeam.players.find(p => p.id === match.currentStrikerId);
  const nonStriker = battingTeam.players.find(p => p.id === match.currentNonStrikerId);
  
  // Get all bowlers who have bowled or are currently bowling
  const activeBowlers = bowlingTeam.players.filter(p => p.oversBowled > 0 || p.id === match.currentBowlerId);

  // Recent balls (last 18)
  const recentBalls = match.balls
    .slice(-18)
    .reverse();

  const currentRR = battingTeam.overs > 0 
    ? (battingTeam.totalRuns / (battingTeam.overs/6)).toFixed(2) 
    : '0.00';

  let reqRR = 'N/A';
  let target = 'N/A';
  
  if (match.currentInnings === 2) {
    const targetScore = bowlingTeam.totalRuns + 1;
    target = targetScore.toString();
    const ballsRemaining = (match.totalOvers * 6) - battingTeam.overs;
    const runsNeeded = targetScore - battingTeam.totalRuns;
    if (ballsRemaining > 0) {
      reqRR = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
    }
  }

  const renderBallCircle = (ball: any, idx: number) => {
    let content = ball.runsScored.toString();
    let colorClass = "bg-gray-200 text-gray-700";
    
    if (ball.isWicket) {
        content = "W";
        colorClass = "bg-highlight text-white font-bold";
    } else if (ball.runsScored === 4) {
        colorClass = "bg-success text-white";
    } else if (ball.runsScored === 6) {
        colorClass = "bg-purple-600 text-white font-bold";
    } else if (ball.extraType !== 'NONE') {
        content = ball.extraType === 'WIDE' ? 'wd' : ball.extraType === 'NO_BALL' ? 'nb' : content;
        colorClass = "bg-yellow-500 text-white";
    }

    return (
        <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm ${colorClass}`}>
            {content}
        </div>
    )
  }

  const getWicketTakerName = (playerId: string, teamPlayers: Player[]) => {
      const wicketBall = match.balls.find(b => b.dismissedPlayerId === playerId);
      if (!wicketBall) return '';
      if (wicketBall.dismissalType === DismissalType.RUN_OUT) return '(Run Out)';
      const bowler = teamPlayers.find(p => p.id === wicketBall.bowlerId);
      return bowler ? `b ${bowler.name}` : '';
  }

  const PlayerAvatar = ({ player, size = 'sm' }: { player: Player, size?: 'sm' | 'md' }) => {
      const dims = size === 'md' ? 'w-8 h-8' : 'w-6 h-6';
      if (player.avatar) {
          return <img src={player.avatar} alt={player.name} className={`${dims} rounded-full border border-gray-200 object-cover`} />;
      }
      return null;
  }

  const renderScorecard = () => {
    const targetInnings = scorecardInnings;
    const isTeamABattingInTarget = (targetInnings === 1 && match.battingFirstId === match.teamA.id) || 
                                   (targetInnings === 2 && match.battingFirstId !== match.teamA.id);
    
    const scBattingTeam = isTeamABattingInTarget ? match.teamA : match.teamB;
    const scBowlingTeam = isTeamABattingInTarget ? match.teamB : match.teamA;
    
    // Players who have batted: faced balls, are currently batting, or are out
    const battedPlayers = scBattingTeam.players.filter(p => p.ballsFaced > 0 || p.isOut || p.id === match.currentStrikerId || p.id === match.currentNonStrikerId);
    const didNotBatPlayers = scBattingTeam.players.filter(p => !battedPlayers.includes(p));

    return (
        <div className="bg-white rounded-xl shadow-lg border border-secondary/30 p-0 overflow-hidden animate-fade-in">
            {/* Scorecard Header */}
            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg text-gray-800">Full Scorecard</h3>
                    {match.currentInnings === 2 && (
                        <div className="flex bg-white rounded-lg p-1 border border-gray-300 shadow-sm">
                            <button 
                                onClick={() => setScorecardInnings(1)}
                                className={`px-3 py-1 text-xs font-bold rounded ${scorecardInnings === 1 ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                1st Innings
                            </button>
                            <button 
                                onClick={() => setScorecardInnings(2)}
                                className={`px-3 py-1 text-xs font-bold rounded ${scorecardInnings === 2 ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                2nd Innings
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Batting Section */}
            <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-accent text-lg">{scBattingTeam.name} <span className="text-gray-500 text-sm font-normal">Batting</span></h4>
                    <span className="font-bold text-xl text-gray-900">{scBattingTeam.totalRuns}/{scBattingTeam.wickets} <span className="text-sm text-gray-500">({formatOvers(scBattingTeam.overs)})</span></span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-gray-500 border-b-2 border-gray-100">
                                <th className="py-2 font-semibold">Batter</th>
                                <th className="py-2 font-semibold"></th>
                                <th className="py-2 text-right font-semibold">R</th>
                                <th className="py-2 text-right font-semibold">B</th>
                                <th className="py-2 text-right font-semibold">4s</th>
                                <th className="py-2 text-right font-semibold">6s</th>
                                <th className="py-2 text-right font-semibold">SR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {battedPlayers.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="py-3 font-bold text-gray-900 flex items-center gap-2">
                                        <PlayerAvatar player={p} />
                                        {p.name}
                                        {p.isCaptain && <CrownBadge />}
                                    </td>
                                    <td className="py-3 text-gray-500 text-xs">
                                        {p.isOut ? (
                                            <span className="text-highlight font-medium">
                                                {getDismissalText(p.dismissalType)} {p.dismissalType !== DismissalType.RUN_OUT && getWicketTakerName(p.id, scBowlingTeam.players)}
                                            </span>
                                        ) : (
                                            <span className="text-green-600 font-medium">not out</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-right font-bold text-gray-900 text-base">{p.runs}</td>
                                    <td className="py-3 text-right text-gray-600">{p.ballsFaced}</td>
                                    <td className="py-3 text-right text-gray-500">{p.fours}</td>
                                    <td className="py-3 text-right text-gray-500">{p.sixes}</td>
                                    <td className="py-3 text-right text-gray-500">{calculateStrikeRate(p.runs, p.ballsFaced)}</td>
                                </tr>
                            ))}
                            {/* Extras Row */}
                            <tr className="bg-gray-50/50">
                                <td colSpan={2} className="py-2 font-semibold text-gray-700">Extras</td>
                                <td colSpan={5} className="py-2 text-right font-medium text-gray-900">{scBattingTeam.extras}</td>
                            </tr>
                             {/* Total Row */}
                            <tr className="bg-gray-100 border-t border-gray-200">
                                <td colSpan={2} className="py-3 font-bold text-gray-900">Total</td>
                                <td colSpan={5} className="py-3 text-right font-bold text-accent text-lg">
                                    {scBattingTeam.totalRuns} <span className="text-sm font-normal text-gray-600">({scBattingTeam.wickets} wkts, {formatOvers(scBattingTeam.overs)} ov)</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {didNotBatPlayers.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Did not bat: </span>
                        {didNotBatPlayers.map(p => p.name).join(', ')}
                    </div>
                )}
            </div>

            {/* Bowling Section */}
            <div className="p-4 border-t border-gray-200 bg-blue-50/10">
                <h4 className="font-bold text-accent text-lg mb-3">{scBowlingTeam.name} <span className="text-gray-500 text-sm font-normal">Bowling</span></h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-gray-500 border-b-2 border-gray-100">
                                <th className="py-2 font-semibold">Bowler</th>
                                <th className="py-2 text-right font-semibold">O</th>
                                <th className="py-2 text-right font-semibold">M</th>
                                <th className="py-2 text-right font-semibold">R</th>
                                <th className="py-2 text-right font-semibold">W</th>
                                <th className="py-2 text-right font-semibold">Eco</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {scBowlingTeam.players.filter(p => p.oversBowled > 0).map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="py-3 font-bold text-gray-900 flex items-center gap-2">
                                        <PlayerAvatar player={p} />
                                        {p.name}
                                        {p.isCaptain && <CrownBadge />}
                                    </td>
                                    <td className="py-3 text-right text-gray-800">{formatOvers(p.oversBowled)}</td>
                                    <td className="py-3 text-right text-gray-500">{p.maidens}</td>
                                    <td className="py-3 text-right font-bold text-gray-900">{p.runsConceded}</td>
                                    <td className="py-3 text-right font-bold text-highlight text-base">{p.wickets}</td>
                                    <td className="py-3 text-right text-gray-600">{calculateEconomy(p.runsConceded, p.oversBowled)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  }

  const CrownBadge = () => (
      <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 font-bold flex items-center justify-center" title="Captain">C</span>
  );

  return (
    <div className="space-y-4">
        {/* Control Bar */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-secondary/30 flex gap-2">
            <button 
                onClick={() => setViewMode('LIVE')}
                className={`flex-1 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all ${viewMode === 'LIVE' ? 'bg-accent text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                <Activity className="w-4 h-4" /> Live Dashboard
            </button>
            <button 
                onClick={() => setViewMode('SCORECARD')}
                className={`flex-1 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all ${viewMode === 'SCORECARD' ? 'bg-accent text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                <ClipboardList className="w-4 h-4" /> Full Scorecard
            </button>
        </div>

      {viewMode === 'SCORECARD' ? (
          renderScorecard()
      ) : (
        /* Live Dashboard View */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-secondary/30 animate-fade-in">
            <div className="bg-accent p-4 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">{battingTeam.name}</h2>
                    <div className="text-sm opacity-80">
                        {match.currentInnings === 2 ? `Target: ${target}` : `1st Innings`}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold tracking-tight">
                        {battingTeam.totalRuns}/{battingTeam.wickets}
                    </div>
                    <div className="text-lg opacity-90 font-medium">
                        {formatOvers(battingTeam.overs)} <span className="text-sm font-light">({match.totalOvers})</span>
                    </div>
                </div>
            </div>
            
            {/* Run Rates & Projection */}
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between text-sm text-gray-600">
                <div className="flex gap-4">
                    <span>CRR: <span className="font-bold text-gray-900">{currentRR}</span></span>
                    {match.currentInnings === 2 && (
                        <span>RRR: <span className="font-bold text-highlight">{reqRR}</span></span>
                    )}
                </div>
                {match.currentInnings === 1 && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <Target className="w-3 h-3" />
                        Projected: {getProjectedScore(battingTeam.totalRuns, battingTeam.overs, match.totalOvers)}
                    </div>
                )}
            </div>

            {/* Current Batsmen Table */}
            <div className="p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Batting</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-400 border-b text-left">
                            <th className="pb-2 font-medium">Batter</th>
                            <th className="pb-2 text-right font-medium">R</th>
                            <th className="pb-2 text-right font-medium">B</th>
                            <th className="pb-2 text-right font-medium">4s</th>
                            <th className="pb-2 text-right font-medium">6s</th>
                            <th className="pb-2 text-right font-medium">SR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[striker, nonStriker].map((p, i) => (
                            p ? (
                            <tr key={p.id} className={p.id === match.currentStrikerId ? "bg-yellow-50" : ""}>
                                <td className="py-2 font-bold text-gray-900 flex items-center gap-1">
                                    <PlayerAvatar player={p} />
                                    {p.name} 
                                    {p.isCaptain && <CrownBadge />}
                                    {p.id === match.currentStrikerId && <span className="text-highlight text-xs">★</span>}
                                </td>
                                <td className="py-2 text-right font-bold text-gray-900">{p.runs}</td>
                                <td className="py-2 text-right text-gray-600">{p.ballsFaced}</td>
                                <td className="py-2 text-right text-gray-500">{p.fours}</td>
                                <td className="py-2 text-right text-gray-500">{p.sixes}</td>
                                <td className="py-2 text-right text-gray-500">{calculateStrikeRate(p.runs, p.ballsFaced)}</td>
                            </tr>
                            ) : null
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bowling Table */}
            <div className="p-4 border-t border-gray-100 bg-blue-50/30">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bowling</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-400 border-b text-left">
                            <th className="pb-2 font-medium">Bowler</th>
                            <th className="pb-2 text-right font-medium">O</th>
                            <th className="pb-2 text-right font-medium">M</th>
                            <th className="pb-2 text-right font-medium">R</th>
                            <th className="pb-2 text-right font-medium">W</th>
                            <th className="pb-2 text-right font-medium">Eco</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {activeBowlers.length > 0 ? activeBowlers.map((p) => (
                            <tr key={p.id} className={p.id === match.currentBowlerId ? "bg-blue-100/50" : ""}>
                                <td className="py-2 font-bold text-accent flex items-center gap-1">
                                    <PlayerAvatar player={p} />
                                    {p.name}
                                    {p.isCaptain && <CrownBadge />}
                                    {p.id === match.currentBowlerId && <div className="w-2 h-2 rounded-full bg-accent animate-pulse ml-1" />}
                                </td>
                                <td className="py-2 text-right text-gray-900">{formatOvers(p.oversBowled)}</td>
                                <td className="py-2 text-right text-gray-500">{p.maidens}</td>
                                <td className="py-2 text-right font-bold text-gray-700">{p.runsConceded}</td>
                                <td className="py-2 text-right font-bold text-accent">{p.wickets}</td>
                                <td className="py-2 text-right text-gray-600">{calculateEconomy(p.runsConceded, p.oversBowled)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="py-4 text-center text-gray-400 italic">No bowlers yet</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Recent Balls - Always visible or hide in Scorecard mode? Usually visible is nice, but let's keep it consistent. It's outside the viewMode condition in previous, let's check. */}
      {/* To keep UI clean, I will keep Recent Balls only in LIVE mode or below both. Below both is useful. */}
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-secondary/30">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Deliveries</h3>
        <div className="flex flex-wrap gap-2">
            {recentBalls.slice(0, 12).map((b, i) => renderBallCircle(b, i))}
        </div>
      </div>
    </div>
  );
};