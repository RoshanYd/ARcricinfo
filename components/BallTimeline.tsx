import React, { useState } from 'react';
import { Match, Ball, ExtraType, DismissalType } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BallTimelineProps {
  match: Match;
  onEditBall?: (ball: Ball) => void;
}

function getBallLabel(ball: Ball): string {
  if (ball.isWicket) return 'W';
  if (ball.extraType === ExtraType.WIDE) return `${ball.runsScored}wd`;
  if (ball.extraType === ExtraType.NO_BALL) return `${ball.runsScored}nb`;
  if (ball.extraType === ExtraType.BYE) return `${ball.runsScored}b`;
  if (ball.extraType === ExtraType.LEG_BYE) return `${ball.runsScored}lb`;
  return String(ball.runsScored);
}

function getBallColor(ball: Ball): string {
  if (ball.isWicket) return 'bg-red-500 text-white';
  if (ball.runsScored === 6) return 'bg-purple-600 text-white';
  if (ball.runsScored === 4) return 'bg-green-500 text-white';
  if (ball.runsScored === 0 && ball.extraType === ExtraType.NONE) return 'bg-gray-200 text-gray-500';
  if (ball.extraType !== ExtraType.NONE) return 'bg-yellow-400 text-yellow-900';
  return 'bg-blue-100 text-blue-800';
}

function getDescription(ball: Ball, allPlayers: { id: string; name: string }[]): string {
  const striker = allPlayers.find(p => p.id === ball.strikerId)?.name ?? 'Batsman';
  const bowler = allPlayers.find(p => p.id === ball.bowlerId)?.name ?? 'Bowler';
  const fielder = ball.fielderId ? allPlayers.find(p => p.id === ball.fielderId)?.name : null;

  let desc = `${bowler} to ${striker}`;

  if (ball.isWicket) {
    const dismissed = allPlayers.find(p => p.id === ball.dismissedPlayerId)?.name ?? striker;
    if (ball.dismissalType === DismissalType.CAUGHT) {
      desc += ` — ${dismissed} c ${fielder ?? '?'} b ${bowler}`;
    } else if (ball.dismissalType === DismissalType.BOWLED) {
      desc += ` — ${dismissed} b ${bowler}`;
    } else if (ball.dismissalType === DismissalType.LBW) {
      desc += ` — ${dismissed} lbw b ${bowler}`;
    } else if (ball.dismissalType === DismissalType.RUN_OUT) {
      desc += ` — ${dismissed} run out`;
    } else if (ball.dismissalType === DismissalType.STUMPED) {
      desc += ` — ${dismissed} st ${fielder ?? '?'} b ${bowler}`;
    } else if (ball.dismissalType === DismissalType.HIT_WICKET) {
      desc += ` — ${dismissed} hit wicket b ${bowler}`;
    } else {
      desc += ` — WICKET`;
    }
    return desc;
  }

  if (ball.extraType === ExtraType.WIDE) desc += `, wide +${ball.runsScored}`;
  else if (ball.extraType === ExtraType.NO_BALL) desc += `, no ball, ${ball.runsScored} run${ball.runsScored !== 1 ? 's' : ''}`;
  else if (ball.extraType === ExtraType.BYE) desc += `, ${ball.runsScored} bye${ball.runsScored !== 1 ? 's' : ''}`;
  else if (ball.extraType === ExtraType.LEG_BYE) desc += `, ${ball.runsScored} leg bye${ball.runsScored !== 1 ? 's' : ''}`;
  else if (ball.runsScored === 4) desc += `, FOUR!`;
  else if (ball.runsScored === 6) desc += `, SIX!`;
  else if (ball.runsScored === 0) desc += `, dot ball`;
  else desc += `, ${ball.runsScored} run${ball.runsScored !== 1 ? 's' : ''}`;

  return desc;
}

export const BallTimeline: React.FC<BallTimelineProps> = ({ match, onEditBall }) => {
  const [expandedOvers, setExpandedOvers] = useState<Set<string>>(new Set());

  const allPlayers = [...match.teamA.players, ...match.teamB.players];
  const mainBalls = match.balls.filter(b => !b.isSuperOver);
  const superOverBalls = match.balls.filter(b => b.isSuperOver);

  // Determine which team batted first
  const battingFirst = match.battingFirstId === match.teamA.id ? match.teamA : match.teamB;
  const battingSecond = match.battingFirstId === match.teamA.id ? match.teamB : match.teamA;
  const battingFirstIds = new Set(battingFirst.players.map(p => p.id));

  // Split into innings
  const innings1 = mainBalls.filter(b => battingFirstIds.has(b.strikerId));
  const innings2 = mainBalls.filter(b => !battingFirstIds.has(b.strikerId));

  // Group balls by over
  const groupByOver = (balls: Ball[]): Map<number, Ball[]> => {
    const map = new Map<number, Ball[]>();
    for (const b of balls) {
      const ov = b.overNumber;
      if (!map.has(ov)) map.set(ov, []);
      map.get(ov)!.push(b);
    }
    return map;
  };

  const toggleOver = (key: string) => {
    setExpandedOvers(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Over summary: total runs, wickets
  const overSummary = (balls: Ball[]) => {
    let runs = 0, wickets = 0;
    for (const b of balls) {
      runs += b.runsScored + (b.extraRuns ?? 0);
      if (b.extraType === ExtraType.WIDE || b.extraType === ExtraType.NO_BALL) runs += 1;
      if (b.isWicket) wickets += 1;
    }
    return { runs, wickets };
  };

  const renderInnings = (balls: Ball[], teamName: string, inningsLabel: string) => {
    const overs = groupByOver(balls);
    const sorted = [...overs.entries()].sort((a, b) => a[0] - b[0]);

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-6 bg-accent rounded-full" />
          <h4 className="font-black text-gray-800">{teamName}</h4>
          <span className="text-gray-400 text-xs font-semibold">{inningsLabel}</span>
        </div>

        <div className="space-y-1.5">
          {sorted.map(([overNum, overBalls]) => {
            const key = `${inningsLabel}-${overNum}`;
            const isExpanded = expandedOvers.has(key);
            const summary = overSummary(overBalls);

            return (
              <div key={key} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {/* Over header */}
                <button onClick={() => toggleOver(key)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full">Ov {overNum + 1}</span>
                    <div className="flex gap-1">
                      {overBalls.map((b, i) => (
                        <span key={i} className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${getBallColor(b)}`}>
                          {getBallLabel(b)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700">{summary.runs} run{summary.runs !== 1 ? 's' : ''}</span>
                    {summary.wickets > 0 && <span className="text-xs font-bold text-red-500">{summary.wickets}W</span>}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-2 space-y-1.5 bg-white">
                    {overBalls.map((b, i) => (
                      <div key={i} className="flex items-start justify-between gap-2.5 text-sm group py-1">
                        <div className="flex items-start gap-2.5">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black shrink-0 mt-0.5 ${getBallColor(b)}`}>
                            {getBallLabel(b)}
                            </span>
                            <p className="text-gray-600 leading-snug">{getDescription(b, allPlayers)}</p>
                        </div>
                        {onEditBall && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEditBall(b); }}
                                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-500 transition-opacity shrink-0"
                            >
                                Edit
                            </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        ⏱️ Match Replay — Ball by Ball
        <span className="text-gray-400 font-normal text-xs">Tap an over to expand</span>
      </h3>

      {innings1.length > 0 && renderInnings(innings1, battingFirst.name, '1st Innings')}
      {innings2.length > 0 && renderInnings(innings2, battingSecond.name, '2nd Innings')}
      {superOverBalls.length > 0 && renderInnings(superOverBalls, 'Super Over', 'SO')}
    </div>
  );
};
