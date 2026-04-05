import React from 'react';
import { Match, Ball, DismissalType } from '../types';
import { Users } from 'lucide-react';

export interface Partnership {
  bat1Id: string;
  bat1Name: string;
  bat2Id: string;
  bat2Name: string;
  runs: number;
  balls: number;
  endedBy?: string; // dismissal of this batter ends the partnership
}

/** Compute partnerships for a specific innings */
export function computePartnerships(match: Match, innings: 1 | 2): Partnership[] {
  const inningsBalls = match.balls.filter(b =>
    innings === 1
      ? !b.isSuperOver && b.overNumber < match.totalOvers
      : !b.isSuperOver
  );

  // Get batting team
  const battingFirst = match.battingFirstId === match.teamA.id ? match.teamA : match.teamB;
  const battingSecond = match.battingFirstId === match.teamA.id ? match.teamB : match.teamA;
  const battingTeam = innings === 1 ? battingFirst : battingSecond;

  // Filter balls for this innings based on ball context
  // Innings 1 balls: before the second innings starts
  // We rely on the fact that balls are ordered chronologically
  const allPlayers = [...match.teamA.players, ...match.teamB.players];
  const getName = (id: string) => allPlayers.find(p => p.id === id)?.name ?? 'Unknown';

  // Split balls into innings based on batsmen belonging to the batting team
  const teamPlayerIds = new Set(battingTeam.players.map(p => p.id));
  const balls = inningsBalls.filter(b => teamPlayerIds.has(b.strikerId));

  if (balls.length === 0) return [];

  const partnerships: Partnership[] = [];
  let currentPair = { striker: balls[0].strikerId, nonStriker: balls[0].nonStrikerId };
  let currentRuns = 0;
  let currentBalls = 0;

  for (const ball of balls) {
    const totalRuns = ball.runsScored + (ball.extraRuns ?? 0) +
      (ball.extraType === 'WIDE' || ball.extraType === 'NO_BALL' ? 1 : 0);
    currentRuns += totalRuns;
    currentBalls += 1;

    if (ball.isWicket && ball.dismissedPlayerId) {
      partnerships.push({
        bat1Id: currentPair.striker,
        bat1Name: getName(currentPair.striker),
        bat2Id: currentPair.nonStriker,
        bat2Name: getName(currentPair.nonStriker),
        runs: currentRuns,
        balls: currentBalls,
        endedBy: getName(ball.dismissedPlayerId),
      });
      currentRuns = 0;
      currentBalls = 0;
      // Next partnership starts with non-dismissed batter + new batter
      const remaining = ball.dismissedPlayerId === currentPair.striker ? currentPair.nonStriker : currentPair.striker;
      currentPair = { striker: remaining, nonStriker: '' }; // next ball will set the new partner
    }
  }

  // Last unbroken partnership
  if (currentBalls > 0) {
    const lastBall = balls[balls.length - 1];
    const finalNonStriker = currentPair.nonStriker || lastBall.nonStrikerId;
    partnerships.push({
      bat1Id: currentPair.striker,
      bat1Name: getName(currentPair.striker),
      bat2Id: finalNonStriker,
      bat2Name: getName(finalNonStriker),
      runs: currentRuns,
      balls: currentBalls,
    });
  }

  return partnerships;
}

// ─── Partnership Bar Chart Component ──────────────────────────────────────────
interface PartnershipsViewProps {
  partnerships: Partnership[];
  teamName: string;
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500',
  'bg-red-400', 'bg-emerald-500',
];

export const PartnershipsView: React.FC<PartnershipsViewProps> = ({ partnerships, teamName }) => {
  const maxRuns = Math.max(...partnerships.map(p => p.runs), 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-400" /> {teamName} — Partnerships
      </h3>
      <div className="space-y-3">
        {partnerships.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 text-center text-xs font-black text-gray-400">#{i + 1}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">
                  {p.bat1Name} & {p.bat2Name}
                </span>
                <span className="font-black text-gray-900 text-sm">{p.runs} <span className="text-gray-400 font-normal text-xs">({p.balls}b)</span></span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${COLORS[i % COLORS.length]}`}
                  style={{ width: `${(p.runs / maxRuns) * 100}%` }}
                />
              </div>
              {p.endedBy && (
                <span className="text-[10px] text-red-400 font-semibold mt-0.5 block">
                  Ended by {p.endedBy} wicket
                </span>
              )}
              {!p.endedBy && (
                <span className="text-[10px] text-green-500 font-semibold mt-0.5 block">
                  Unbroken ✓
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
