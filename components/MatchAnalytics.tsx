import React, { useMemo } from 'react';
import { Match, Ball, MatchStatus } from '../types';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Activity, BarChart2 } from 'lucide-react';

interface MatchAnalyticsProps {
  match: Match;
}

export const MatchAnalytics: React.FC<MatchAnalyticsProps> = ({ match }) => {
  // Process match balls into an aggregated Array per over.
  const chartData = useMemo(() => {
    // Determine Team A and Team B based on battingFirstId.
    const teamAId = match.battingFirstId || match.teamA.id;
    const teamBId = teamAId === match.teamA.id ? match.teamB.id : match.teamA.id;
    const teamAName = teamAId === match.teamA.id ? match.teamA.name : match.teamB.name;
    const teamBName = teamBId === match.teamA.id ? match.teamA.name : match.teamB.name;

    // Filter normal innings (exclude super overs)
    const innings1Balls = match.balls.filter(b => b.isSuperOver === false && match.currentInnings >= 2 ? match.balls.indexOf(b) < match.balls.findIndex((x) => x.strikerId === match.teamB.players[0]?.id || x.strikerId === match.teamB.players[1]?.id) : true); // This logic needs to be simpler.
    
    // Simpler grouping:
    const overMap = new Map<number, { over: number, t1Runs: number, t2Runs: number, t1Cum: number, t2Cum: number }>();
    
    for (let i = 1; i <= match.totalOvers; i++) {
        overMap.set(i, { over: i, t1Runs: 0, t2Runs: 0, t1Cum: 0, t2Cum: 0 });
    }

    // Since our balls don't explicitly carry 'battingTeamId', we approximate by innings boundaries.
    // If innings == 1, teamA hits. If innings == 2, teamB hits.
    
    // We actually need to compute exactly:
    let t1Cum = 0;
    let t2Cum = 0;

    let isTeam1Batting = true;
    let currentOver = 1;
    let ballsInOver = 0;

    // To accurately parse, we should rely on the natural progression of match.balls.
    // However, it's safer to partition balls manually.
    // Let's just group them exactly relying on `ball.overNumber` and `match` team structure.
    
    const team1PIds = new Set(match.battingFirstId === match.teamA.id ? match.teamA.players.map(p=>p.id) : match.teamB.players.map(p=>p.id));

    match.balls.forEach(ball => {
        if (ball.isSuperOver) return;
        const totalRuns = ball.runsScored + ball.extraRuns;
        const isT1 = team1PIds.has(ball.strikerId);
        
        const ovRecord = overMap.get(ball.overNumber) || { over: ball.overNumber, t1Runs: 0, t2Runs: 0, t1Cum: 0, t2Cum: 0 };
        
        if (isT1) {
            ovRecord.t1Runs += totalRuns;
            t1Cum += totalRuns;
        } else {
            ovRecord.t2Runs += totalRuns;
            t2Cum += totalRuns;
        }

        ovRecord.t1Cum = t1Cum;
        ovRecord.t2Cum = t2Cum;
        
        overMap.set(ball.overNumber, ovRecord);
    });

    return {
        data: Array.from(overMap.values()),
        teamAName,
        teamBName
    };
  }, [match.balls]);

  if (match.balls.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-10 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Activity className="w-12 h-12 mb-4 text-gray-300" />
              <p>No analytics generated yet.</p>
              <p className="text-sm">Start scoring the match to see CricInsights.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* WORM CHART */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-800 flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-accent" /> Run Rate Worm
        </h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="over" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" name={chartData.teamAName} dataKey="t1Cum" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" name={chartData.teamBName} dataKey="t2Cum" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* MANHATTAN CHART */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-800 flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-blue-500" /> Manhattan Graph (Runs per Over)
        </h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="over" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar name={chartData.teamAName} dataKey="t1Runs" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar name={chartData.teamBName} dataKey="t2Runs" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
