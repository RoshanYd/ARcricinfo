import React from 'react';
import { Ball, Player } from '../types';

interface WagonWheelProps {
  balls: Ball[];
  batsmanId?: string; // filter for specific batsman, or show all
  size?: number;
}

// Generate a deterministic angle based on ball properties
function getAngle(ball: Ball, index: number): number {
  // Use a hash-like approach for consistent but varied angles
  const seed = ball.id ? ball.id.charCodeAt(0) + ball.id.charCodeAt(ball.id.length - 1) : index;
  const baseAngle = (seed * 137.508 + index * 47) % 360; // golden angle distribution
  return baseAngle;
}

function getLength(runs: number, maxRadius: number): number {
  if (runs === 0) return maxRadius * 0.15;
  if (runs === 1) return maxRadius * 0.35;
  if (runs === 2) return maxRadius * 0.5;
  if (runs === 3) return maxRadius * 0.65;
  if (runs === 4) return maxRadius * 0.85;
  if (runs >= 6) return maxRadius * 1.0;
  return maxRadius * 0.4;
}

function getColor(ball: Ball): string {
  if (ball.isWicket) return '#ef4444'; // red
  if (ball.runsScored === 6) return '#f59e0b'; // amber/orange
  if (ball.runsScored === 4) return '#3b82f6'; // blue
  if (ball.runsScored === 0) return 'rgba(148,163,184,0.3)'; // faint gray
  return 'rgba(255,255,255,0.6)'; // white-ish for 1/2/3
}

function getStrokeWidth(ball: Ball): number {
  if (ball.isWicket) return 3;
  if (ball.runsScored >= 4) return 2.5;
  return 1.5;
}

export const WagonWheel: React.FC<WagonWheelProps> = ({ balls, batsmanId, size = 300 }) => {
  const filteredBalls = batsmanId
    ? balls.filter(b => b.strikerId === batsmanId && b.extraType === 'NONE')
    : balls.filter(b => b.extraType === 'NONE');

  const cx = size / 2;
  const cy = size / 2;
  const fieldRadius = (size / 2) - 20;
  const pitchW = size * 0.04;
  const pitchH = size * 0.18;

  // Stats counts
  const dots = filteredBalls.filter(b => b.runsScored === 0 && !b.isWicket).length;
  const ones = filteredBalls.filter(b => b.runsScored === 1).length;
  const twos = filteredBalls.filter(b => b.runsScored === 2).length;
  const fours = filteredBalls.filter(b => b.runsScored === 4).length;
  const sixes = filteredBalls.filter(b => b.runsScored === 6).length;
  const wickets = filteredBalls.filter(b => b.isWicket).length;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
        🏏 Wagon Wheel
        <span className="text-gray-400 font-normal text-xs">{filteredBalls.length} balls</span>
      </h3>

      <div className="flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Field - outer oval */}
          <ellipse cx={cx} cy={cy} rx={fieldRadius} ry={fieldRadius}
            fill="#1a472a" stroke="#2d5a3d" strokeWidth="2" />

          {/* Inner ring - 30 yard circle */}
          <ellipse cx={cx} cy={cy} rx={fieldRadius * 0.55} ry={fieldRadius * 0.55}
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Boundary ring */}
          <ellipse cx={cx} cy={cy} rx={fieldRadius - 2} ry={fieldRadius - 2}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Pitch rectangle */}
          <rect x={cx - pitchW / 2} y={cy - pitchH / 2} width={pitchW} height={pitchH}
            fill="#c4a35a" rx="2" stroke="#8b7335" strokeWidth="0.5" />

          {/* Crease lines */}
          <line x1={cx - pitchW * 1.5} y1={cy - pitchH / 2 + 4} x2={cx + pitchW * 1.5} y2={cy - pitchH / 2 + 4}
            stroke="white" strokeWidth="0.8" />
          <line x1={cx - pitchW * 1.5} y1={cy + pitchH / 2 - 4} x2={cx + pitchW * 1.5} y2={cy + pitchH / 2 - 4}
            stroke="white" strokeWidth="0.8" />

          {/* Shot lines */}
          {filteredBalls.map((ball, i) => {
            const angle = getAngle(ball, i) * (Math.PI / 180);
            const length = getLength(ball.runsScored, fieldRadius);
            const endX = cx + Math.cos(angle) * length;
            const endY = cy + Math.sin(angle) * length;
            return (
              <line key={ball.id || i}
                x1={cx} y1={cy}
                x2={endX} y2={endY}
                stroke={getColor(ball)}
                strokeWidth={getStrokeWidth(ball)}
                strokeLinecap="round"
                opacity={ball.runsScored === 0 && !ball.isWicket ? 0.3 : 0.8}
              />
            );
          })}

          {/* Center dot (batsman position) */}
          <circle cx={cx} cy={cy} r={3} fill="white" stroke="#1a472a" strokeWidth="1" />

          {/* Direction labels */}
          <text x={cx} y={14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold">OFF</text>
          <text x={cx} y={size - 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold">LEG</text>
          <text x={8} y={cy + 3} textAnchor="start" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold">MID</text>
          <text x={size - 8} y={cy + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold">COV</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
        {[
          { label: 'Dot', count: dots, color: 'bg-gray-300' },
          { label: '1/2/3', count: ones + twos, color: 'bg-white border border-gray-300' },
          { label: 'Four', count: fours, color: 'bg-blue-500' },
          { label: 'Six', count: sixes, color: 'bg-amber-500' },
          { label: 'Wicket', count: wickets, color: 'bg-red-500' },
        ].filter(l => l.count > 0).map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            <span className="text-xs text-gray-500 font-semibold">{l.label} ({l.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
