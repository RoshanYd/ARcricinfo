import React, { useState } from 'react';
import { Tournament, TournamentFormat, TournamentFixture } from '../types';
import { generateKnockoutFixtures, generateLeagueFixtures, initPointsTable } from '../utils/tournamentLogic';
import { Trophy, Users, Zap, RotateCcw, CheckCircle, ChevronRight, ChevronLeft, ArrowRight, Layers, Link, Plus, Trash2 } from 'lucide-react';

interface TournamentSetupProps {
  onTournamentCreate: (t: Tournament) => void;
  onBack: () => void;
}

const TEAM_COUNT_OPTIONS = [4, 6, 8, 16];

const FormatCard = ({ format, selected, onSelect }: {
  format: TournamentFormat; selected: boolean; onSelect: () => void;
}) => (
  <button onClick={onSelect}
    className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
      selected
        ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
        : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${selected ? 'bg-accent' : 'bg-gray-100'}`}>
      {format === 'KNOCKOUT' ? (
        <Zap className={`w-6 h-6 ${selected ? 'text-white' : 'text-gray-500'}`} />
      ) : (
        <Layers className={`w-6 h-6 ${selected ? 'text-white' : 'text-gray-500'}`} />
      )}
    </div>
    <h3 className={`font-black text-lg mb-1 ${selected ? 'text-accent' : 'text-gray-800'}`}>
      {format === 'KNOCKOUT' ? 'Knockout' : 'League'}
    </h3>
    <p className="text-sm text-gray-500 leading-relaxed">
      {format === 'KNOCKOUT'
        ? 'Elimination format. Lose once and you\'re out. Fast and exciting.'
        : 'Round robin — every team plays every other team. Points table decides the champion.'}
    </p>
  </button>
);

export const TournamentSetup: React.FC<TournamentSetupProps> = ({ onTournamentCreate, onBack }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('KNOCKOUT');
  const [teamCount, setTeamCount] = useState(4);
  const [overs, setOvers] = useState(10);
  const [playersPerTeam, setPlayersPerTeam] = useState(11);
  const [teamNames, setTeamNames] = useState<string[]>(Array(4).fill(''));
  const [previewFixtures, setPreviewFixtures] = useState<TournamentFixture[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorImage, setSponsorImage] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualTeam1, setManualTeam1] = useState('');
  const [manualTeam2, setManualTeam2] = useState('');

  const updateTeamName = (i: number, val: string) => {
    const updated = [...teamNames];
    updated[i] = val;
    setTeamNames(updated);
  };

  const handleTeamCountChange = (count: number) => {
    setTeamCount(count);
    setTeamNames(prev => {
      const updated = [...prev];
      while (updated.length < count) updated.push('');
      return updated.slice(0, count);
    });
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Tournament name is required';
    if (overs < 1 || overs > 50) e.overs = 'Overs must be between 1 and 50';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const filled = teamNames.slice(0, teamCount);
    filled.forEach((n, i) => {
      if (!n.trim()) e[`team_${i}`] = 'Required';
    });
    const unique = new Set(filled.map(n => n.trim().toLowerCase()));
    if (unique.size !== filled.length) e.duplicate = 'Team names must be unique';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep1Next = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!validateStep2()) return;
    const teams = teamNames.slice(0, teamCount).map(n => n.trim());
    const fixtures = format === 'KNOCKOUT'
      ? generateKnockoutFixtures(teams)
      : generateLeagueFixtures(teams);
    setPreviewFixtures(fixtures);
    setStep(3);
  };

  const handleCreate = () => {
    const teams = teamNames.slice(0, teamCount).map(n => n.trim());
    // Use previewFixtures directly as it holds either AUTO generated or MANUAL user fixtures
    const fixtures = previewFixtures;
    
    const tournament: Tournament = {
      id: crypto.randomUUID(),
      name: name.trim(),
      date: Date.now(),
      format,
      overs,
      playersPerTeam,
      teams,
      fixtures,
      pointsTable: initPointsTable(teams),
      status: 'ACTIVE',
      currentRound: 1,
      sponsorName: sponsorName.trim() || undefined,
      sponsorImage: sponsorImage.trim() || undefined,
      scheduleMode: scheduleMode
    };
    onTournamentCreate(tournament);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-accent mb-6 transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-400/30">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-accent">Create Tournament</h1>
        <p className="text-gray-500 mt-1">Set up your tournament in 3 quick steps</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s < step ? 'bg-green-500 text-white' : s === step ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`h-1 w-12 rounded ${s < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-800 mb-2">Tournament Details</h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tournament Name</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Summer Cricket Cup 2025"
                className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-colors font-medium text-gray-900 placeholder-gray-400 ${
                  errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-accent'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Format</label>
              <div className="flex gap-3">
                <FormatCard format="KNOCKOUT" selected={format === 'KNOCKOUT'} onSelect={() => setFormat('KNOCKOUT')} />
                <FormatCard format="LEAGUE" selected={format === 'LEAGUE'} onSelect={() => setFormat('LEAGUE')} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Overs Per Match</label>
              <div className="flex flex-wrap items-center gap-2">
                {[5, 6, 8, 10, 15, 20].map(o => (
                  <button key={o} onClick={() => setOvers(o)}
                    className={`min-w-[3rem] px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      overs === o ? 'bg-accent text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>{o}</button>
                ))}
                <input
                  type="number" value={overs} min={1} max={50}
                  onChange={e => setOvers(Number(e.target.value))}
                  className="w-16 px-2 py-2.5 border-2 border-gray-200 rounded-xl text-center font-bold outline-none focus:border-accent text-sm"
                />
              </div>
              {errors.overs && <p className="text-red-500 text-xs mt-1">{errors.overs}</p>}
            </div>

            {/* Players Per Team */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Players Per Team</label>
              <div className="flex flex-wrap items-center gap-2">
                {[5, 6, 8, 11, 15].map(n => (
                  <button key={n} onClick={() => setPlayersPerTeam(n)}
                    className={`min-w-[3rem] px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      playersPerTeam === n ? 'bg-accent text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>{n}</button>
                ))}
                <input
                  type="number" value={playersPerTeam} min={2} max={25}
                  onChange={e => setPlayersPerTeam(Number(e.target.value))}
                  className="w-16 px-2 py-2.5 border-2 border-gray-200 rounded-xl text-center font-bold outline-none focus:border-accent text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Number of players each team will have per match</p>
            </div>

            {/* Sponsor Fields */}
            <div className="pt-2 border-t border-gray-100 mt-6">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Link className="w-4 h-4 text-accent" /> Tournament Sponsor (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Sponsor Name</label>
                  <input
                    value={sponsorName} onChange={e => setSponsorName(e.target.value)}
                    placeholder="e.g. Dream11"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-accent text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Logo URL (Image)</label>
                  <input
                    value={sponsorImage} onChange={e => setSponsorImage(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-accent text-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            <button onClick={handleStep1Next}
              className="w-full py-3.5 bg-accent text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
              Next: Add Teams <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── Step 2: Teams ── */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-800">Add Teams</h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Number of Teams</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {TEAM_COUNT_OPTIONS.filter(n => format === 'LEAGUE' || (n & (n - 1)) === 0).map(n => (
                    <button key={n} onClick={() => handleTeamCountChange(n)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        teamCount === n ? 'bg-accent text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >{n}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl">
                  <span className="text-xs font-bold text-gray-500 px-2 uppercase tracking-wider">Custom:</span>
                  <input 
                    type="number" value={teamCount} min={3} max={64}
                    onChange={(e) => handleTeamCountChange(parseInt(e.target.value) || 4)}
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-bold outline-none focus:border-accent text-sm"
                  />
                </div>
              </div>
              {format === 'KNOCKOUT' && (teamCount & (teamCount - 1)) !== 0 && (
                 <p className="text-amber-500 text-xs mt-2 font-bold bg-amber-50 p-2 rounded w-fit border border-amber-100">
                    ⚠️ Knockout tournaments work best with powers of 2 (4, 8, 16). Byes may cause issues.
                 </p>
              )}
            </div>

            {errors.duplicate && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">
                {errors.duplicate}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: teamCount }).map((_, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Team {i + 1}
                  </label>
                  <input
                    value={teamNames[i] ?? ''}
                    onChange={e => updateTeamName(i, e.target.value)}
                    placeholder={`e.g. Mumbai Strikers`}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl outline-none transition-colors font-semibold text-gray-900 placeholder-gray-400 text-sm ${
                      errors[`team_${i}`] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-accent'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={handleStep2Next}
                className="flex-1 py-3 bg-accent text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                Preview Fixtures <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-800">{name}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {format === 'KNOCKOUT' ? '🏆 Knockout' : '📊 League'} · {teamCount} Teams · {overs} Overs
              </p>
            </div>

            <div>
              {/* Schedule Mode Toggle */}
              <div className="flex items-center justify-between mb-6 bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => {
                    setScheduleMode('AUTO');
                    const teams = teamNames.slice(0, teamCount).map(n => n.trim());
                    setPreviewFixtures(format === 'KNOCKOUT' ? generateKnockoutFixtures(teams) : generateLeagueFixtures(teams));
                  }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${scheduleMode === 'AUTO' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Auto Generate Schedule
                </button>
                <button 
                  onClick={() => {
                    setScheduleMode('MANUAL');
                    setPreviewFixtures([]); // Clear fixtures for manual mode
                  }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${scheduleMode === 'MANUAL' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Manual Schedule
                </button>
              </div>

              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                {scheduleMode === 'MANUAL' ? 'Custom Fixtures' : (format === 'KNOCKOUT' ? 'Round 1 Fixtures' : `All ${previewFixtures.length} League Fixtures`)}
              </h3>

              {scheduleMode === 'MANUAL' && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 animate-fade-in">
                  <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Match</h4>
                  <div className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 w-full">
                      <label className="text-xs text-blue-600 font-bold mb-1 block uppercase tracking-wider">Team 1</label>
                      <select value={manualTeam1} onChange={e => setManualTeam1(e.target.value)} className="w-full p-2.5 rounded-lg border border-blue-200 text-sm font-semibold outline-none focus:border-accent bg-white text-gray-800">
                        <option value="">Select Team</option>
                        {teamNames.slice(0, teamCount).map(t => <option key={t} value={t}>{t || 'Unnamed'}</option>)}
                      </select>
                    </div>
                    <div className="flex-shrink-0 font-black text-blue-300 pb-3 hidden sm:block">VS</div>
                    <div className="flex-1 w-full">
                      <label className="text-xs text-blue-600 font-bold mb-1 block uppercase tracking-wider">Team 2</label>
                      <select value={manualTeam2} onChange={e => setManualTeam2(e.target.value)} className="w-full p-2.5 rounded-lg border border-blue-200 text-sm font-semibold outline-none focus:border-accent bg-white text-gray-800">
                        <option value="">Select Team</option>
                        {teamNames.slice(0, teamCount).map(t => <option key={t} value={t}>{t || 'Unnamed'}</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={() => {
                        if (!manualTeam1 || !manualTeam2 || manualTeam1 === manualTeam2) return;
                        setPreviewFixtures(prev => [...prev, {
                          id: crypto.randomUUID(),
                          label: `Match ${prev.length + 1}`,
                          team1: manualTeam1,
                          team2: manualTeam2,
                          status: 'PENDING',
                          matchId: crypto.randomUUID(),
                          round: 1
                        }]);
                        setManualTeam1('');
                        setManualTeam2('');
                      }}
                      disabled={!manualTeam1 || !manualTeam2 || manualTeam1 === manualTeam2}
                      className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 shrink-0 flex justify-center items-center gap-1.5 transition-colors sm:h-[42px]"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              )}

              {previewFixtures.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-gray-500 font-medium">No fixtures added yet. {scheduleMode === 'MANUAL' ? 'Add your first match above.' : ''}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {previewFixtures.map((f, i) => (
                    <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase w-28 shrink-0">{f.label}</span>
                      <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
                        <span className="font-bold text-gray-800 text-sm text-right flex-1 sm:flex-none">{f.team1}</span>
                        <span className="text-[10px] font-black text-white bg-gray-800 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">vs</span>
                        <span className="font-bold text-gray-800 text-sm text-left flex-1 sm:flex-none">{f.team2}</span>
                      </div>
                      {scheduleMode === 'MANUAL' && (
                        <button 
                          onClick={() => setPreviewFixtures(prev => prev.filter(fix => fix.id !== f.id))}
                          className="pt-2 sm:pt-0 shrink-0 text-red-400 hover:text-red-500 transition-colors ml-auto sm:ml-4 flex justify-end"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {format === 'KNOCKOUT' && previewFixtures.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 font-medium">
                💡 Teams are randomized. Next round fixtures auto-generate after each round completes.
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={handleCreate}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/30 hover:shadow-xl transition-all">
                🏆 Start Tournament <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
