import React, { useState, useMemo } from 'react';
import { Tournament, TournamentFixture, Match, Player } from '../types';
import { Trophy, Play, Clock, CheckCircle2, ChevronRight, Medal, Target, Layers, Zap, ArrowLeft, Flag, Trash2, Link, Star, Activity, User } from 'lucide-react';

interface TournamentViewProps {
  tournament: Tournament;
  matches?: Match[];
  onStartFixtureMatch: (fixture: TournamentFixture) => void;
  onBack: () => void;
  onEndTournament?: () => void;
  onDeleteTournament?: () => void;
}

// ─── Points Table ─────────────────────────────────────────────────────────────
const PointsTable = ({ tournament }: { tournament: Tournament }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white shadow-sm">
          <th className="text-left px-5 py-4 font-bold rounded-tl-xl text-xs uppercase tracking-wider">#</th>
          <th className="text-left px-5 py-4 font-bold text-xs uppercase tracking-wider">Team</th>
          <th className="px-3 py-4 font-bold text-xs uppercase tracking-wider text-center">P</th>
          <th className="px-3 py-4 font-bold text-xs uppercase tracking-wider text-center">W</th>
          <th className="px-3 py-4 font-bold text-xs uppercase tracking-wider text-center">L</th>
          <th className="px-3 py-4 font-bold text-xs uppercase tracking-wider text-center">T</th>
          <th className="px-3 py-4 font-bold text-xs uppercase tracking-wider text-center">Pts</th>
          <th className="px-5 py-4 font-bold rounded-tr-xl text-xs uppercase tracking-wider text-center">NRR</th>
        </tr>
      </thead>
      <tbody>
        {tournament.pointsTable.map((entry, i) => (
          <tr key={entry.teamName}
            className={`border-b border-gray-100 transition-all hover:-translate-y-[1px] hover:shadow-sm ${
              i === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-l-4 border-l-yellow-400' : 
              i < 3 ? 'bg-gradient-to-r from-green-50/40 to-white border-l-4 border-l-green-400' : 'bg-white border-l-4 border-l-transparent'
            }`}
          >
            <td className="px-5 py-4 font-black">
              {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400">{i + 1}</span>}
            </td>
            <td className="px-5 py-4 font-bold text-gray-900">{entry.teamName}</td>
            <td className="px-3 py-4 text-center font-bold text-gray-500">{entry.played}</td>
            <td className="px-3 py-4 text-center font-black text-green-600">{entry.won}</td>
            <td className="px-3 py-4 text-center font-bold text-red-400">{entry.lost}</td>
            <td className="px-3 py-4 text-center font-bold text-gray-400">{entry.tied}</td>
            <td className="px-3 py-4 text-center font-black text-accent text-lg">{entry.points}</td>
            <td className={`px-5 py-4 text-center font-black ${entry.nrr >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {entry.nrr > 0 ? '+' : ''}{entry.nrr.toFixed(3)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Knockout Bracket ─────────────────────────────────────────────────────────
const KnockoutBracket = ({ tournament }: { tournament: Tournament }) => {
  const maxRound = Math.max(...tournament.fixtures.map(f => f.round));
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map(round => {
          const roundFixtures = tournament.fixtures.filter(f => f.round === round);
          const label = round === maxRound ? 'Final' : round === maxRound - 1 ? 'Semi Finals' : `Round ${round}`;
          return (
            <div key={round} className="flex flex-col gap-4">
              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {label}
                </span>
              </div>
              <div className="flex flex-col gap-6">
                {roundFixtures.map(f => (
                  <div key={f.id} className={`w-52 rounded-2xl border-2 overflow-hidden shadow-sm ${
                    f.status === 'COMPLETED' ? 'border-green-200' : 'border-gray-200'
                  }`}>
                    {[
                      { name: f.team1, score: f.team1Score, isWinner: f.winner === f.team1 },
                      { name: f.team2, score: f.team2Score, isWinner: f.winner === f.team2 },
                    ].map((side, si) => (
                      <div key={si} className={`flex items-center justify-between px-3 py-2.5 ${
                        si === 0 ? 'border-b border-gray-100' : ''
                      } ${side.isWinner ? 'bg-yellow-50' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          {side.isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                          <span className={`font-bold text-sm truncate max-w-[100px] ${
                            side.isWinner ? 'text-yellow-700' : f.status === 'PENDING' ? 'text-gray-400' : 'text-gray-600'
                          }`}>{side.name || 'TBD'}</span>
                        </div>
                        {side.score && (
                          <span className="text-xs font-black text-gray-700 shrink-0">{side.score}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {tournament.champion && (
          <div className="flex flex-col items-center justify-center gap-3 ml-4">
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-widest text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">Champion</span>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 text-center shadow-xl shadow-yellow-400/30">
              <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="font-black text-white text-lg">{tournament.champion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Fixture Card ─────────────────────────────────────────────────────────────
const FixtureCard: React.FC<{ fixture: TournamentFixture; overs: number; onStart: () => void }> = ({ fixture, overs, onStart }) => {
  const isPending = fixture.status === 'PENDING';
  const isDone = fixture.status === 'COMPLETED';

  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
      isPending ? 'border-gray-100 hover:border-accent/40 hover:shadow-md' :
      isDone ? 'border-green-100' : 'border-blue-200 shadow-md'
    }`}>
      {/* Round label */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        isDone ? 'bg-green-50' : isPending ? 'bg-gray-50' : 'bg-blue-50'
      }`}>
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{fixture.label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          isDone ? 'bg-green-100 text-green-700' :
          isPending ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
        }`}>
          {isDone ? '✓ Done' : isPending ? `${overs} ov` : '🔴 Live'}
        </span>
      </div>

      {/* Match */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Team 1 */}
          <div className="flex-1">
            <p className={`font-black text-base truncate ${fixture.winner === fixture.team1 ? 'text-yellow-600' : 'text-gray-800'}`}>
              {fixture.winner === fixture.team1 && '🏆 '}{fixture.team1}
            </p>
            {fixture.team1Score && <p className="text-gray-500 text-sm font-bold">{fixture.team1Score}</p>}
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-black text-accent bg-accent/10 px-2 py-1 rounded-full">VS</span>
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-right">
            <p className={`font-black text-base truncate ${fixture.winner === fixture.team2 ? 'text-yellow-600' : 'text-gray-800'}`}>
              {fixture.team2}{fixture.winner === fixture.team2 && ' 🏆'}
            </p>
            {fixture.team2Score && <p className="text-gray-500 text-sm font-bold">{fixture.team2Score}</p>}
          </div>
        </div>

        {/* Action */}
        {isPending && (
          <button onClick={onStart}
            className="w-full mt-4 py-2.5 bg-accent text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors shadow-md shadow-accent/20 text-sm">
            <Play className="w-4 h-4 fill-current" /> Start Match
          </button>
        )}
        {fixture.status === 'LIVE' && (
          <button onClick={onStart}
            className="w-full mt-4 py-2.5 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 text-sm">
            <Play className="w-4 h-4 fill-current" /> Resume Match
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────
export const TournamentView: React.FC<TournamentViewProps> = ({
  tournament, matches = [], onStartFixtureMatch, onBack, onEndTournament, onDeleteTournament
}) => {
  const [tab, setTab] = useState<'FIXTURES' | 'TABLE' | 'BRACKET' | 'LEADERBOARDS'>('FIXTURES');

  const completedCount = tournament.fixtures.filter(f => f.status === 'COMPLETED').length;
  const totalCount = tournament.fixtures.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Group fixtures by round for display
  const rounds = [...new Set<number>(tournament.fixtures.map(f => f.round))].sort((a, b) => a - b);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-accent transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Tournaments
        </button>
        {onDeleteTournament && (
          <button onClick={() => onDeleteTournament()} className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-sm font-bold transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      {/* Sponsor Banner */}
      {tournament.sponsorImage && (
        <div className="w-full h-24 md:h-32 rounded-3xl overflow-hidden mb-6 shadow-md border border-gray-200 bg-white flex items-center justify-center relative group">
           <img src={tournament.sponsorImage} alt={tournament.sponsorName || 'Sponsor'} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
           {tournament.sponsorName && (
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
               <span className="text-white font-bold text-sm tracking-widest uppercase">Sponsored by {tournament.sponsorName}</span>
             </div>
           )}
        </div>
      )}

      {/* Champion Banner */}
      {tournament.status === 'COMPLETED' && tournament.champion && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-3xl p-6 mb-6 text-center shadow-2xl shadow-yellow-400/30 animate-scale-up">
          <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
          <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1">🏆 Tournament Champion</p>
          <p className="text-white font-black text-3xl">{tournament.champion}</p>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 md:p-8 mb-6 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(250,204,21,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.3) 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                  tournament.format === 'KNOCKOUT' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-blue-400/20 text-blue-300'
                }`}>
                  {tournament.format === 'KNOCKOUT' ? '⚡ KNOCKOUT' : '📊 LEAGUE'}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  tournament.status === 'COMPLETED' ? 'bg-green-400/20 text-green-300' : 'bg-orange-400/20 text-orange-300'
                }`}>
                  {tournament.status === 'COMPLETED' ? '✓ Completed' : '🔴 Active'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{tournament.name}</h1>
              <p className="text-slate-400 text-sm mt-1">
                {tournament.teams.length} Teams · {tournament.overs} Overs/Match · {new Date(tournament.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <Trophy className="w-10 h-10 text-yellow-400/60" />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1.5">
              <span>{completedCount}/{totalCount} matches played</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Teams chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {tournament.teams.map(t => (
              <span key={t} className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-white text-xs font-semibold">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-6 gap-1">
        <button onClick={() => setTab('FIXTURES')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'FIXTURES' ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
          }`}>📅 Fixtures</button>
        {tournament.format === 'LEAGUE' && (
          <button onClick={() => setTab('TABLE')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'TABLE' ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
            }`}>📊 Points</button>
        )}
        {tournament.format === 'KNOCKOUT' && (
          <button onClick={() => setTab('BRACKET')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'BRACKET' ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
            }`}>🏆 Bracket</button>
        )}
        <button onClick={() => setTab('LEADERBOARDS')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'LEADERBOARDS' ? 'bg-accent text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
          }`}>⭐ Stats</button>
      </div>

      {/* Tab Content */}
      {tab === 'FIXTURES' && (
        <div className="space-y-6">
          {rounds.map(round => {
            const roundFixtures = tournament.fixtures.filter(f => f.round === round);
            const roundLabel = round === 1 ? 'Round 1' :
              roundFixtures[0]?.label.replace(/ \d+$/, '') || `Round ${round}`;
            return (
              <div key={round}>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5" /> {roundLabel}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roundFixtures.map(fixture => (
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      overs={tournament.overs}
                      onStart={() => onStartFixtureMatch(fixture)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'TABLE' && tournament.format === 'LEAGUE' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-700">Points Table</h3>
            <p className="text-xs text-gray-400 mt-0.5">P=Played, W=Won, L=Lost, T=Tied, Pts=Points, NRR=Net Run Rate</p>
          </div>
          <PointsTable tournament={tournament} />
        </div>
      )}

      {tab === 'BRACKET' && tournament.format === 'KNOCKOUT' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
          <KnockoutBracket tournament={tournament} />
        </div>
      )}

      {tab === 'LEADERBOARDS' && (
        <div className="space-y-6 animate-fade-in">
           <TournamentLeaderboards matches={matches} />
        </div>
      )}
    </div>
  );
};

// ─── Leaderboards Component ───────────────────────────────────────────────────
const TournamentLeaderboards: React.FC<{ matches: Match[] }> = ({ matches }) => {
  const aggregated = useMemo(() => {
    const stats = new Map<string, { name: string, team: string, runs: number, wickets: number, matches: Set<string> }>();
    
    matches.forEach(m => {
      [m.teamA, m.teamB].forEach(team => {
        team.players.forEach(p => {
          if (!stats.has(p.name)) {
            stats.set(p.name, { name: p.name, team: team.name, runs: 0, wickets: 0, matches: new Set() });
          }
          const s = stats.get(p.name)!;
          s.runs += p.runsScored;
          s.wickets += p.wickets;
          s.matches.add(m.id);
        });
      });
    });

    return Array.from(stats.values()).map(s => ({ ...s, matchCount: s.matches.size }));
  }, [matches]);

  if (matches.length === 0) return <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">No matches completed yet. Stats will appear here once games finish.</div>;

  const topBatsmen = [...aggregated].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topBowlers = [...aggregated].sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  // Simple MVP logic: 1 run = 1 pt, 1 wkt = 20 pts
  const topMVP = [...aggregated].map(a => ({ ...a, points: a.runs + a.wickets * 20 })).sort((a, b) => b.points - a.points).slice(0, 5);

  const LeaderboardCard = ({ title, icon, data, valueKey, label }: { title: string, icon: React.ReactNode, data: any[], valueKey: string, label: string }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
        {icon}
        <h3 className="font-black text-gray-800">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {data.map((p, i) => (
          <div key={p.name} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
             <div className="flex items-center gap-3">
               <span className={`w-6 text-center font-black ${i === 0 ? 'text-yellow-500 text-lg' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'}`}>{i + 1}</span>
               <div>
                 <p className="font-bold text-gray-900">{p.name} {i === 0 && '👑'}</p>
                 <p className="text-xs font-semibold text-gray-500">{p.team} · {p.matchCount} M</p>
               </div>
             </div>
             <div className="text-right">
               <p className="font-black text-accent text-lg">{p[valueKey]}</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <LeaderboardCard title="Most Runs" icon={<Activity className="w-5 h-5 text-blue-500" />} data={topBatsmen} valueKey="runs" label="Runs" />
      <LeaderboardCard title="Most Wickets" icon={<Target className="w-5 h-5 text-red-500" />} data={topBowlers} valueKey="wickets" label="Wkts" />
      <div className="md:col-span-2">
         <LeaderboardCard title="Most Valuable Player (MVP)" icon={<Star className="w-5 h-5 text-yellow-500" />} data={topMVP} valueKey="points" label="Pts" />
      </div>
    </div>
  );
};
