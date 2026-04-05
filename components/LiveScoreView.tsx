import React, { useEffect, useState } from 'react';
import { Match, MatchStatus } from '../types';
import { loadLiveScore } from '../utils/db';
import { supabase } from '../utils/supabase';
import { Loader2, Wifi, WifiOff, Trophy, Activity, Youtube } from 'lucide-react';

// Helper to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface LiveScoreViewProps {
  matchId: string;
  onClose?: () => void;
}

export const LiveScoreView: React.FC<LiveScoreViewProps> = ({ matchId, onClose }) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Initial fetch
  useEffect(() => {
    loadLiveScore(matchId).then(m => {
      if (m) { setMatch(m); setLastUpdated(new Date()); }
      else setError('Match not found or has ended.');
      setLoading(false);
    });
  }, [matchId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`live_match_${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `id=eq.${matchId}`,
      }, (payload: any) => {
        if (payload.new?.match_data) {
          setMatch(payload.new.match_data);
          setLastUpdated(new Date());
          setIsConnected(true);
        }
        if (payload.eventType === 'DELETE') {
          setError('Match has ended.');
        }
      })
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  // Fallback polling every 8s
  useEffect(() => {
    const interval = setInterval(async () => {
      const m = await loadLiveScore(matchId);
      if (m) { setMatch(m); setLastUpdated(new Date()); }
    }, 8000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-bold">Loading live score...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center max-w-md">
          <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Match Not Available</h2>
          <p className="text-white/60">{error || 'This match has ended or the link is invalid.'}</p>
          {onClose && (
            <button onClick={onClose} className="mt-6 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const battingTeam = match.teamA.isBatting ? match.teamA : match.teamB;
  const bowlingTeam = match.teamA.isBatting ? match.teamB : match.teamA;
  const isSuperOver = match.currentInnings > 2;

  const currentRuns = isSuperOver ? battingTeam.superOverRuns : battingTeam.totalRuns;
  const currentWickets = isSuperOver ? battingTeam.superOverWickets : battingTeam.wickets;
  const currentOvers = isSuperOver ? battingTeam.superOverBalls : battingTeam.overs;
  const oversStr = `${Math.floor(currentOvers / 6)}.${currentOvers % 6}`;

  const striker = battingTeam.players.find(p => p.id === match.currentStrikerId);
  const nonStriker = battingTeam.players.find(p => p.id === match.currentNonStrikerId);
  const bowler = bowlingTeam.players.find(p => p.id === match.currentBowlerId);

  // Target info for 2nd innings
  const isSecondInnings = match.currentInnings === 2 || match.currentInnings === 4;
  let target = 0;
  let remaining = 0;
  if (isSecondInnings) {
    target = (match.currentInnings === 2 ? bowlingTeam.totalRuns : bowlingTeam.superOverRuns) + 1;
    remaining = target - currentRuns;
  }

  // Last few balls
  const recentBalls = match.balls.slice(-12).map(b => {
    if (b.isWicket) return 'W';
    if (b.extraType === 'WIDE') return `${b.runsScored}wd`;
    if (b.extraType === 'NO_BALL') return `${b.runsScored}nb`;
    if (b.extraType === 'BYE') return `${b.runsScored}b`;
    if (b.extraType === 'LEG_BYE') return `${b.runsScored}lb`;
    return String(b.runsScored);
  });

  const isCompleted = match.status === MatchStatus.COMPLETED;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900">
      {/* Live indicator */}
      <div className="flex items-center justify-center py-3 gap-2">
        {!isCompleted ? (
          <>
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-black uppercase tracking-widest">Live</span>
          </>
        ) : (
          <>
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">Completed</span>
          </>
        )}
        {isConnected ? (
          <Wifi className="w-3.5 h-3.5 text-green-400 ml-2" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-400 ml-2" />
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* ARcricinfo Branding */}
        <div className="text-center mb-4">
          <img src="https://i.postimg.cc/fRdWdn9t/20251127-224320.png" className="w-10 h-10 rounded-full mx-auto mb-1" alt="ARcricinfo" />
          <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">ARcricinfo</p>
        </div>

        {/* Innings info */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center mb-4">
          <span className="text-white/50 text-xs font-bold">
            {isSuperOver ? 'Super Over' : `Innings ${match.currentInnings}`} · {match.totalOvers} ov match
          </span>
        </div>

        {/* YouTube Livestream Embed */}
        {match.youtubeUrl && getYouTubeVideoId(match.youtubeUrl) && (
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-4 aspect-video relative">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(match.youtubeUrl)}?autoplay=1&mute=1`}
              title="YouTube Livestream"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* Main Score Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-4">
          {/* Team Scores */}
          <div className="p-6">
            {/* 1st innings score (bowling team) */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <span className="text-white/50 font-bold">{bowlingTeam.name}</span>
              <span className="text-white/50 font-black text-lg">
                {isSuperOver ? bowlingTeam.superOverRuns : bowlingTeam.totalRuns}/{isSuperOver ? bowlingTeam.superOverWickets : bowlingTeam.wickets}
                <span className="text-white/30 text-sm ml-1">
                  ({Math.floor((isSuperOver ? bowlingTeam.superOverBalls : bowlingTeam.overs) / 6)}.{(isSuperOver ? bowlingTeam.superOverBalls : bowlingTeam.overs) % 6})
                </span>
              </span>
            </div>

            {/* Batting team (main) */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-black text-xl">{battingTeam.name}</h2>
                {isSecondInnings && !isCompleted && (
                  <p className="text-yellow-300 text-xs font-bold mt-1">
                    Need {remaining} from {Math.floor(((match.totalOvers * 6) - currentOvers) / 6)}.{((match.totalOvers * 6) - currentOvers) % 6} ov
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-white font-black text-4xl">{currentRuns}/{currentWickets}</span>
                <p className="text-white/40 text-sm font-bold">{oversStr} ov</p>
              </div>
            </div>
          </div>

          {/* Batsmen & Bowler */}
          {!isCompleted && (
            <div className="bg-white/5 px-6 py-4 space-y-2">
              {striker && (
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm">{striker.name} *</span>
                  <span className="text-white/70 text-sm">
                    {isSuperOver ? striker.superOverStats?.runs ?? 0 : striker.runs} ({isSuperOver ? striker.superOverStats?.ballsFaced ?? 0 : striker.ballsFaced})
                  </span>
                </div>
              )}
              {nonStriker && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">{nonStriker.name}</span>
                  <span className="text-white/40 text-sm">
                    {isSuperOver ? nonStriker.superOverStats?.runs ?? 0 : nonStriker.runs} ({isSuperOver ? nonStriker.superOverStats?.ballsFaced ?? 0 : nonStriker.ballsFaced})
                  </span>
                </div>
              )}
              {bowler && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                  <span className="text-blue-300 text-sm font-bold">🎳 {bowler.name}</span>
                  <span className="text-white/40 text-sm">
                    {Math.floor((isSuperOver ? bowler.superOverStats?.oversBowled ?? 0 : bowler.oversBowled) / 6)}.{(isSuperOver ? bowler.superOverStats?.oversBowled ?? 0 : bowler.oversBowled) % 6}-
                    {isSuperOver ? bowler.superOverStats?.runsConceded ?? 0 : bowler.runsConceded}-
                    {isSuperOver ? bowler.superOverStats?.wickets ?? 0 : bowler.wickets}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Recent balls */}
          <div className="px-6 py-3 bg-white/5 border-t border-white/5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-white/30 text-xs font-bold shrink-0">Recent:</span>
              {recentBalls.map((ball, i) => (
                <span key={i} className={`inline-flex items-center justify-center min-w-[28px] h-7 rounded-full text-xs font-black px-1.5 ${
                  ball === 'W' ? 'bg-red-500/80 text-white' :
                  ball === '4' ? 'bg-green-500/80 text-white' :
                  ball === '6' ? 'bg-purple-500/80 text-white' :
                  ball === '0' ? 'bg-white/5 text-white/40' :
                  'bg-white/10 text-white/70'
                }`}>{ball}</span>
              ))}
            </div>
          </div>

          {/* Winner */}
          {isCompleted && (
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 px-6 py-4 text-center border-t border-yellow-400/20">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <p className="text-yellow-300 font-black">
                {match.winningTeamId
                  ? `${match.winningTeamId === match.teamA.id ? match.teamA.name : match.teamB.name} Won!`
                  : 'Match Drawn'}
              </p>
            </div>
          )}
        </div>

        {/* Update time */}
        {lastUpdated && (
          <p className="text-center text-white/20 text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};
