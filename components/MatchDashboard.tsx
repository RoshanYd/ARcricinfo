
import React, { useState } from 'react';
import { Match, Team, Player, DismissalType, Ball, MatchStatus } from '../types';
import { formatOvers, calculateEconomy, calculateStrikeRate, getProjectedScore, getDismissalText } from '../utils/cricketLogic';
import { Trophy, Activity, Wind, Target, ClipboardList, BarChart2, User, Pencil, Save, X, Crown, Star } from 'lucide-react';
import { MatchAnalytics } from './MatchAnalytics';

interface DashboardProps {
  match: Match;
  onPlayerUpdate?: (playerId: string, newName: string) => void;
}

export const MatchDashboard: React.FC<DashboardProps> = ({ match, onPlayerUpdate }) => {
  const [viewMode, setViewMode] = useState<'LIVE' | 'SCORECARD' | 'ANALYTICS'>('LIVE');
  const [scorecardInnings, setScorecardInnings] = useState<number>(match.currentInnings > 2 ? 3 : match.currentInnings);
  
  // Player Edit State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  React.useEffect(() => {
    // If Super Over, default to innings 3
    setScorecardInnings(match.currentInnings > 2 ? 3 : match.currentInnings);
  }, [match.currentInnings]);

  const startEditing = (p: Player) => {
      setEditingPlayerId(p.id);
      setEditName(p.name);
  }

  const saveEdit = () => {
      if(editingPlayerId && editName.trim() && onPlayerUpdate) {
          onPlayerUpdate(editingPlayerId, editName.trim());
      }
      setEditingPlayerId(null);
      setEditName('');
  }

  // Helper to determine active team based on innings including Super Over
  const getActiveTeams = (innings: number) => {
     // Innings 1: Bat First Team Bats
     if (innings === 1) {
         return match.battingFirstId === match.teamA.id 
            ? { bat: match.teamA, bowl: match.teamB } 
            : { bat: match.teamB, bowl: match.teamA };
     }
     // Innings 2: Bowl First Team Bats
     if (innings === 2) {
         return match.battingFirstId === match.teamA.id 
            ? { bat: match.teamB, bowl: match.teamA } 
            : { bat: match.teamA, bowl: match.teamB };
     }
     // Innings 3: Super Over (Team A) - Logic: Team A always bats first in SO for simplicity in this app
     if (innings === 3) {
         return { bat: match.teamA, bowl: match.teamB };
     }
     // Innings 4: Super Over (Team B)
     if (innings === 4) {
         return { bat: match.teamB, bowl: match.teamA };
     }
     return { bat: match.teamA, bowl: match.teamB };
  };

  const { bat: battingTeam, bowl: bowlingTeam } = getActiveTeams(match.currentInnings);

  const striker = battingTeam.players.find(p => p.id === match.currentStrikerId);
  const nonStriker = battingTeam.players.find(p => p.id === match.currentNonStrikerId);
  
  const isSuperOver = match.currentInnings > 2;
  
  // Filter active bowlers based on context
  const activeBowlers = bowlingTeam.players.filter(p => {
      if (isSuperOver) {
          // In Super Over, only show bowlers who have bowled in the SO or are currently bowling
          return (p.superOverStats && p.superOverStats.oversBowled > 0) || (p.superOverStats && p.id === match.currentBowlerId);
      }
      // In main match, show standard bowlers
      return p.oversBowled > 0 || p.id === match.currentBowlerId;
  });

  const displayRuns = isSuperOver ? battingTeam.superOverRuns : battingTeam.totalRuns;
  const displayWickets = isSuperOver ? battingTeam.superOverWickets : battingTeam.wickets;
  const displayOvers = isSuperOver ? battingTeam.superOverBalls : battingTeam.overs;

  const currentRR = displayOvers > 0 
    ? (displayRuns / (displayOvers/6)).toFixed(2) 
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
  } else if (match.currentInnings === 4) {
      // Super Over Chase
      const targetScore = bowlingTeam.superOverRuns + 1;
      target = targetScore.toString();
      const ballsRemaining = 6 - battingTeam.superOverBalls;
      const runsNeeded = targetScore - battingTeam.superOverRuns;
       if (ballsRemaining > 0) {
          reqRR = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
       }
  }

  // --- Helpers for Player Stats Display (Switching Main vs Super Over) ---
  const getPlayerRuns = (p: Player) => isSuperOver ? (p.superOverStats?.runs || 0) : p.runs;
  const getPlayerBalls = (p: Player) => isSuperOver ? (p.superOverStats?.ballsFaced || 0) : p.ballsFaced;
  const getPlayerFours = (p: Player) => isSuperOver ? (p.superOverStats?.fours || 0) : p.fours;
  const getPlayerSixes = (p: Player) => isSuperOver ? (p.superOverStats?.sixes || 0) : p.sixes;
  
  const getBowlerOvers = (p: Player) => isSuperOver ? (p.superOverStats?.oversBowled || 0) : p.oversBowled;
  const getBowlerMaidens = (p: Player) => isSuperOver ? (p.superOverStats?.maidens || 0) : p.maidens;
  const getBowlerRuns = (p: Player) => isSuperOver ? (p.superOverStats?.runsConceded || 0) : p.runsConceded;
  const getBowlerWickets = (p: Player) => isSuperOver ? (p.superOverStats?.wickets || 0) : p.wickets;

  const renderBallCircle = (ball: Ball, idx: number) => {
    let content = ball.runsScored.toString();
    let colorClass = "bg-gray-100 text-gray-600 border border-gray-200";
    
    if (ball.isWicket) {
        content = "W";
        colorClass = "bg-highlight text-white font-bold border-highlight";
    } else if (ball.extraType !== 'NONE') {
        colorClass = "bg-yellow-100 text-yellow-700 border-yellow-300";
        if (ball.extraType === 'WIDE') content = `${ball.extraRuns}wd`;
        else if (ball.extraType === 'NO_BALL') content = `${ball.runsScored + 1}nb`;
        else if (ball.extraType === 'BYE') content = `${ball.extraRuns}b`;
        else if (ball.extraType === 'LEG_BYE') content = `${ball.extraRuns}lb`;
    } else if (ball.runsScored === 4) {
        colorClass = "bg-success text-white border-success";
    } else if (ball.runsScored === 6) {
        colorClass = "bg-purple-600 text-white font-bold border-purple-600";
    }

    if (ball.extraType === 'NO_BALL' && (ball.runsScored === 4 || ball.runsScored === 6)) {
        colorClass = ball.runsScored === 6 ? "bg-purple-600 text-white font-bold border-purple-600" : "bg-success text-white border-success";
    }

    return (
        <div key={idx} className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${colorClass} flex-shrink-0`}>
            {content}
        </div>
    )
  }

  // Filter balls for current innings context
  const currentInningsBalls = match.balls.filter(b => {
      if (match.currentInnings === 1 || match.currentInnings === 2) {
          // Normal innings balls, not super over
          return !b.isSuperOver && battingTeam.players.some(p => p.id === b.strikerId);
      } else {
          // Super over balls
          return b.isSuperOver && battingTeam.players.some(p => p.id === b.strikerId);
      }
  });

  const groupedOvers: { [key: number]: Ball[] } = {};
  currentInningsBalls.forEach(ball => {
      if (!groupedOvers[ball.overNumber]) groupedOvers[ball.overNumber] = [];
      groupedOvers[ball.overNumber].push(ball);
  });

  const sortedOvers = Object.keys(groupedOvers)
    .map(Number)
    .sort((a, b) => b - a)
    .map(overNum => ({
        overNum,
        balls: groupedOvers[overNum]
    }));


  const getWicketTakerName = (playerId: string, teamPlayers: Player[]) => {
      const wicketBall = match.balls.find(b => b.dismissedPlayerId === playerId && b.isSuperOver === isSuperOver);
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
      return <User className={`${dims} text-gray-400 p-1 bg-gray-100 rounded-full border border-gray-200`} />;
  }

  const renderScorecard = () => {
    const { bat: scBattingTeam, bowl: scBowlingTeam } = getActiveTeams(scorecardInnings);
    const isScorecardSuperOver = scorecardInnings > 2;
    
    // Switch stats getters based on scorecard context
    const getSCRuns = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.runs || 0) : p.runs;
    const getSCBalls = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.ballsFaced || 0) : p.ballsFaced;
    const getSCFours = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.fours || 0) : p.fours;
    const getSCSixes = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.sixes || 0) : p.sixes;
    const getSCIsOut = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.isOut || false) : p.isOut;
    const getSCDismissal = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.dismissalType || DismissalType.NONE) : p.dismissalType;
    
    // Bowling Stats Getters
    const getSCBowlerOvers = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.oversBowled || 0) : p.oversBowled;
    const getSCBowlerMaidens = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.maidens || 0) : p.maidens;
    const getSCBowlerRuns = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.runsConceded || 0) : p.runsConceded;
    const getSCBowlerWickets = (p: Player) => isScorecardSuperOver ? (p.superOverStats?.wickets || 0) : p.wickets;

    // Filter batted players: 
    // 1. Have faced balls or scored runs
    // 2. Are out
    // 3. Are current striker/non-striker for the ACTIVE match innings matching this scorecard
    // 4. Have initialized Super Over stats (for SO)
    const isViewingActiveInnings = match.currentInnings === scorecardInnings;

    const battedPlayers = scBattingTeam.players.filter(p => {
        const hasStats = getSCBalls(p) > 0 || getSCRuns(p) > 0;
        const isOut = getSCIsOut(p);
        const isAtCrease = isViewingActiveInnings && (p.id === match.currentStrikerId || p.id === match.currentNonStrikerId);
        const hasSOStats = isScorecardSuperOver && p.superOverStats !== undefined;
        
        return hasStats || isOut || isAtCrease || hasSOStats;
    });

    // Find players who did not bat
    const didNotBatPlayers = scBattingTeam.players.filter(p => !battedPlayers.includes(p));

    // Filter bowlers who bowled in this specific innings
    const bowledPlayers = scBowlingTeam.players.filter(p => getSCBowlerOvers(p) > 0 || (isScorecardSuperOver && p.superOverStats !== undefined));

    // Team Stats
    const scRuns = isScorecardSuperOver ? scBattingTeam.superOverRuns : scBattingTeam.totalRuns;
    const scWickets = isScorecardSuperOver ? scBattingTeam.superOverWickets : scBattingTeam.wickets;
    const scOvers = isScorecardSuperOver ? scBattingTeam.superOverBalls : scBattingTeam.overs;
    
    return (
        <div className="bg-white rounded-xl shadow-lg border border-secondary/30 p-0 overflow-hidden animate-fade-in relative">
            {/* Edit Modal Overlay */}
            {editingPlayerId && (
                <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-4 w-full max-w-xs shadow-xl animate-scale-up border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-2">Edit Player Name</h4>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 border-2 border-gray-300 rounded mb-3 text-gray-900 bg-white font-bold focus:border-accent outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2">
                             <button onClick={() => setEditingPlayerId(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded font-medium text-sm">Cancel</button>
                             <button onClick={saveEdit} className="flex-1 py-2 bg-success text-white rounded font-bold text-sm">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Match Result */}
            {match.status === MatchStatus.COMPLETED && (
                <div className="bg-gradient-to-r from-accent to-blue-900 text-white p-6 text-center border-b border-white/10">
                     <div className="text-3xl font-black mb-1 uppercase tracking-tight drop-shadow-sm">
                         {match.winningTeamId ? (match.winningTeamId === match.teamA.id ? match.teamA.name : match.teamB.name) : "Match Drawn"}
                         {match.winningTeamId && " WON"}
                     </div>
                </div>
            )}

            <div className="bg-gray-100 p-4 border-b flex justify-between items-center flex-wrap gap-2">
                <div className="flex bg-white rounded-lg p-1 border border-gray-300 shadow-sm">
                    <button 
                        onClick={() => setViewMode('LIVE')}
                        className={`text-xs md:text-sm px-3 py-1.5 font-bold rounded ${viewMode === 'LIVE' ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                    >
                        Live Match
                    </button>
                    <button 
                        onClick={() => setViewMode('SCORECARD')}
                        className={`text-xs md:text-sm px-3 py-1.5 font-bold rounded ${viewMode === 'SCORECARD' ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                    >
                        Scorecard
                    </button>
                    <button 
                        onClick={() => setViewMode('ANALYTICS')}
                        className={`text-xs md:text-sm px-3 py-1.5 font-bold rounded ${viewMode === 'ANALYTICS' ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                    >
                        CricInsights
                    </button>
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto">
                    <div className="flex bg-white rounded-lg p-1 border border-gray-300 shadow-sm">
                        <button 
                            onClick={() => setScorecardInnings(1)}
                            className={`px-3 py-1 text-xs font-bold rounded whitespace-nowrap ${scorecardInnings === 1 ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Innings 1
                        </button>
                        <button 
                            onClick={() => setScorecardInnings(2)}
                            className={`px-3 py-1 text-xs font-bold rounded whitespace-nowrap ${scorecardInnings === 2 ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Innings 2
                        </button>
                         {(match.teamA.superOverBalls > 0 || match.teamB.superOverBalls > 0) && (
                            <>
                                <button 
                                    onClick={() => setScorecardInnings(3)}
                                    className={`px-3 py-1 text-xs font-bold rounded whitespace-nowrap ${scorecardInnings === 3 ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    SO 1
                                </button>
                                <button 
                                    onClick={() => setScorecardInnings(4)}
                                    className={`px-3 py-1 text-xs font-bold rounded whitespace-nowrap ${scorecardInnings === 4 ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    SO 2
                                </button>
                            </>
                         )}
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Batting Table */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-accent text-lg">{scBattingTeam.name} <span className="text-gray-500 text-sm font-normal">{isScorecardSuperOver ? 'Super Over' : 'Batting'}</span></h4>
                        <span className="font-bold text-xl text-gray-900">{scRuns}/{scWickets} <span className="text-sm text-gray-500">({formatOvers(scOvers)})</span></span>
                    </div>
                    
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="py-2 font-semibold pl-3">Batter</th>
                                    <th className="py-2 font-semibold">Dismissal</th>
                                    <th className="py-2 text-right font-semibold">R</th>
                                    <th className="py-2 text-right font-semibold">B</th>
                                    <th className="py-2 text-right font-semibold">4s</th>
                                    <th className="py-2 text-right font-semibold">6s</th>
                                    <th className="py-2 text-right font-semibold pr-3">SR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {battedPlayers.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 group">
                                        <td className="py-3 font-bold text-gray-900 flex items-center gap-2 pl-3">
                                            <PlayerAvatar player={p} />
                                            {p.name}
                                            {p.isCaptain && <Crown className="w-3 h-3 text-yellow-500 fill-current" />}
                                            <button 
                                                onClick={() => startEditing(p)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                                                title="Edit Name"
                                            >
                                                <Pencil className="w-3 h-3 text-gray-500" />
                                            </button>
                                        </td>
                                        <td className="py-2 text-xs text-gray-500">
                                            {!getSCIsOut(p) ? (
                                                <span className="text-green-600 font-semibold">not out</span>
                                            ) : (
                                                <span className="text-red-500">{getDismissalText(getSCDismissal(p))} {getWicketTakerName(p.id, scBowlingTeam.players)}</span>
                                            )}
                                        </td>
                                        <td className="py-2 text-right font-bold text-gray-900">{getSCRuns(p)}</td>
                                        <td className="py-2 text-right text-gray-600">{getSCBalls(p)}</td>
                                        <td className="py-2 text-right text-success font-medium">{getSCFours(p)}</td>
                                        <td className="py-2 text-right text-purple-600 font-medium">{getSCSixes(p)}</td>
                                        <td className="py-2 text-right text-gray-500 pr-3">{calculateStrikeRate(getSCRuns(p), getSCBalls(p))}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                                    <td colSpan={2} className="py-3 pl-3">Total</td>
                                    <td colSpan={5} className="py-3 text-right pr-3">{scRuns}/{scWickets} <span className="text-sm font-normal text-gray-600">({formatOvers(scOvers)} Ov)</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Did Not Bat Section */}
                    {didNotBatPlayers.length > 0 && (
                        <div className="bg-white border-t border-gray-100 p-3 text-sm mt-2 rounded-lg border border-gray-200/50">
                            <span className="font-bold text-gray-700 mr-2">Did not bat:</span>
                            <span className="text-gray-600 leading-relaxed text-xs">
                                {didNotBatPlayers.map((p, i) => (
                                    <React.Fragment key={p.id}>
                                        {p.name}{i < didNotBatPlayers.length - 1 ? ', ' : ''}
                                    </React.Fragment>
                                ))}
                            </span>
                        </div>
                    )}
                </div>

                {/* Bowling Table */}
                <div>
                     <h4 className="font-bold text-accent text-lg mb-3">{scBowlingTeam.name} <span className="text-gray-500 text-sm font-normal">Bowling</span></h4>
                     <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="py-2 font-semibold pl-3">Bowler</th>
                                    <th className="py-2 text-right font-semibold">O</th>
                                    <th className="py-2 text-right font-semibold">M</th>
                                    <th className="py-2 text-right font-semibold">R</th>
                                    <th className="py-2 text-right font-semibold">W</th>
                                    <th className="py-2 text-right font-semibold pr-3">Eco</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bowledPlayers.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="py-3 font-bold text-gray-900 flex items-center gap-2 pl-3">
                                            <PlayerAvatar player={p} />
                                            {p.name}
                                        </td>
                                        <td className="py-2 text-right text-gray-800">{formatOvers(getSCBowlerOvers(p))}</td>
                                        <td className="py-2 text-right text-gray-600">{getSCBowlerMaidens(p)}</td>
                                        <td className="py-2 text-right text-gray-800">{getSCBowlerRuns(p)}</td>
                                        <td className="py-2 text-right font-bold text-highlight">{getSCBowlerWickets(p)}</td>
                                        <td className="py-2 text-right text-gray-500 pr-3">{calculateEconomy(getSCBowlerRuns(p), getSCBowlerOvers(p))}</td>
                                    </tr>
                                ))}
                                {bowledPlayers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-gray-400 italic">No bowling data yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
  }

  if (viewMode === 'SCORECARD') {
      return renderScorecard();
  }
  
  if (viewMode === 'ANALYTICS') {
      return (
        <div className="animate-fade-in space-y-4">
            <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                <button 
                    onClick={() => setViewMode('LIVE')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'LIVE' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Live Match
                </button>
                <button 
                    onClick={() => setViewMode('SCORECARD')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'SCORECARD' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Scorecard
                </button>
                <button 
                    onClick={() => setViewMode('ANALYTICS')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'ANALYTICS' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    CricInsights
                </button>
            </div>
            <MatchAnalytics match={match} />
        </div>
      )
  }

  const getYoutubeEmbedUrl = (url?: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const matchUrl = url.match(regExp);
      return (matchUrl && matchUrl[2].length === 11) ? `https://www.youtube.com/embed/${matchUrl[2]}?autoplay=1&mute=1` : null;
  }
  const embedUrl = getYoutubeEmbedUrl(match.youtubeUrl);

  return (
    <div className="animate-fade-in space-y-4">
      {/* View Toggle */}
      <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button 
                onClick={() => setViewMode('LIVE')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'LIVE' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Live Match
            </button>
            <button 
                onClick={() => setViewMode('SCORECARD')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'SCORECARD' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Scorecard
            </button>
            <button 
                onClick={() => setViewMode('ANALYTICS')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'ANALYTICS' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                CricInsights
            </button>
      </div>

      {embedUrl && (
          <div className="bg-white rounded-xl shadow-lg border border-secondary/30 p-2 overflow-hidden aspect-video">
              <iframe 
                width="100%" 
                height="100%" 
                src={embedUrl}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
                className="rounded-lg"
              ></iframe>
          </div>
      )}

      <div className={`bg-white rounded-xl shadow-lg border border-secondary/30 p-6 relative overflow-hidden ${isSuperOver ? 'ring-2 ring-purple-400' : ''}`}>
        {/* Super Over Badge */}
        {isSuperOver && (
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                SUPER OVER
            </div>
        )}

        {/* Top Header - Score */}
        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-accent flex items-center gap-2">
                {battingTeam.name}
            </h3>
            <div className="text-5xl font-black text-gray-800 mt-1 tracking-tight">
              {displayRuns}/{displayWickets}
              <span className="text-xl font-medium text-gray-500 ml-3">
                ({formatOvers(displayOvers)} Ov)
              </span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">CRR</div>
             <div className="text-2xl font-bold text-accent">{currentRR}</div>
             {(match.currentInnings === 2 || match.currentInnings === 4) && (
                 <>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2">Target</div>
                    <div className="text-lg font-bold text-gray-700">{target} <span className="text-xs font-normal">({reqRR} RRR)</span></div>
                 </>
             )}
          </div>
        </div>

        {/* Current Batsmen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-xl border-2 transition-all ${striker ? 'border-accent bg-blue-50/50' : 'border-dashed border-gray-300'}`}>
            <div className="flex justify-between items-center mb-2">
               <span className="flex items-center gap-2 font-bold text-accent">
                   <PlayerAvatar player={striker || {name: '', avatar: ''} as any} />
                   {striker ? striker.name : 'Select Striker'}
                   <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded font-bold">STR</span>
                   {striker?.isCaptain && <Crown className="w-3 h-3 text-yellow-500 fill-current" />}
               </span>
            </div>
            {striker && (
                <div className="flex justify-between items-end">
                    <div className="text-3xl font-black text-gray-800">{getPlayerRuns(striker)} <span className="text-sm font-medium text-gray-500">({getPlayerBalls(striker)})</span></div>
                    <div className="text-xs font-bold text-gray-400">
                        4s: <span className="text-gray-700">{getPlayerFours(striker)}</span> • 6s: <span className="text-gray-700">{getPlayerSixes(striker)}</span> • SR: {calculateStrikeRate(getPlayerRuns(striker), getPlayerBalls(striker))}
                    </div>
                </div>
            )}
          </div>

          <div className={`p-4 rounded-xl border-2 transition-all ${nonStriker ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300'}`}>
            <div className="flex justify-between items-center mb-2">
               <span className="flex items-center gap-2 font-bold text-gray-600">
                   <PlayerAvatar player={nonStriker || {name: '', avatar: ''} as any} />
                   {nonStriker ? nonStriker.name : 'Select Non-Striker'}
                   {nonStriker?.isCaptain && <Crown className="w-3 h-3 text-yellow-500 fill-current" />}
               </span>
            </div>
             {nonStriker && (
                <div className="flex justify-between items-end">
                    <div className="text-3xl font-black text-gray-800">{getPlayerRuns(nonStriker)} <span className="text-sm font-medium text-gray-500">({getPlayerBalls(nonStriker)})</span></div>
                    <div className="text-xs font-bold text-gray-400">
                        4s: <span className="text-gray-700">{getPlayerFours(nonStriker)}</span> • 6s: <span className="text-gray-700">{getPlayerSixes(nonStriker)}</span> • SR: {calculateStrikeRate(getPlayerRuns(nonStriker), getPlayerBalls(nonStriker))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Current Bowlers Table */}
        <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Bowling Card</h4>
            <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-200">
                            <th className="p-2 pl-3">Bowler</th>
                            <th className="p-2 text-right">O</th>
                            <th className="p-2 text-right">M</th>
                            <th className="p-2 text-right">R</th>
                            <th className="p-2 text-right">W</th>
                            <th className="p-2 text-right pr-3">Eco</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {activeBowlers.map(b => (
                            <tr key={b.id} className={`${b.id === match.currentBowlerId ? 'bg-blue-50' : ''}`}>
                                <td className="p-2 pl-3 font-bold text-gray-800 flex items-center gap-2">
                                    {b.id === match.currentBowlerId && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>}
                                    <PlayerAvatar player={b} />
                                    {b.name}
                                </td>
                                <td className="p-2 text-right font-mono">{formatOvers(getBowlerOvers(b))}</td>
                                <td className="p-2 text-right text-gray-600">{getBowlerMaidens(b)}</td>
                                <td className="p-2 text-right font-mono">{getBowlerRuns(b)}</td>
                                <td className="p-2 text-right font-mono font-bold text-highlight">{getBowlerWickets(b)}</td>
                                <td className="p-2 text-right font-mono text-gray-500 pr-3">{calculateEconomy(getBowlerRuns(b), getBowlerOvers(b))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Recent Overs */}
        <div className="border-t border-gray-100 pt-4">
             <div className="flex items-center gap-2 mb-3">
                <Wind className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Overs {isSuperOver ? '(Super Over)' : ''}</span>
             </div>
             
             <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                 {/* Current Over - First */}
                 {sortedOvers.map((overData, idx) => (
                     <div key={overData.overNum} className="flex flex-col gap-1 min-w-fit">
                         <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                             {idx === 0 ? 'Current' : `Over ${overData.overNum + 1}`}
                         </div>
                         <div className="flex gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                             {overData.balls.map((ball, bIdx) => renderBallCircle(ball, bIdx))}
                         </div>
                     </div>
                 ))}
                 {sortedOvers.length === 0 && (
                     <div className="text-sm text-gray-400 italic">Match just started...</div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};
