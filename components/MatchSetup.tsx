import React, { useState, useEffect } from 'react';
import { Team, Player, UserProfile, PersistentTeam } from '../types';
import { createTeam, createPlayer } from '../utils/cricketLogic';
import { DBPlayer } from '../utils/db';
import { PlayerAutosuggestInput } from './PlayerAutosuggestInput';
import { Users, UserPlus, PlayCircle, Trash2, Crown, User, X, Minus, Plus, Bookmark, Calendar } from 'lucide-react';
import { useToast } from './Toast';

interface MatchSetupProps {
  onMatchCreate: (teamA: Team, teamB: Team, overs: number, youtubeUrl?: string) => void;
  onScheduleMatch?: (teamA: Team, teamB: Team, overs: number, dateMs: number, youtubeUrl?: string) => void;
  userProfile: UserProfile | null;
  defaultOvers?: number;
  userTeams?: PersistentTeam[];
  initialData?: {
      teamAName: string;
      teamBName: string;
      teamASquad: string[];
      teamBSquad: string[];
  }
  dbPlayers?: DBPlayer[];
}

export const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchCreate, onScheduleMatch, userProfile, initialData, defaultOvers, userTeams, dbPlayers }) => {
  const { toast } = useToast();
  const [teamAName, setTeamAName] = useState('Warriors');
  const [teamBName, setTeamBName] = useState('Titans');
  const [overs, setOvers] = useState(defaultOvers ?? 10);
  const [squadSize, setSquadSize] = useState(11);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Initialize with empty strings based on squadSize
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(Array(11).fill(''));
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(Array(11).fill(''));
  
  // Captain Selection Indices
  const [teamACaptainIndex, setTeamACaptainIndex] = useState(0);
  const [teamBCaptainIndex, setTeamBCaptainIndex] = useState(0);

  // Load initial data if provided (Series Mode)
  useEffect(() => {
      if (initialData) {
          setTeamAName(initialData.teamAName);
          setTeamBName(initialData.teamBName);
          
          // Determine squad size from initial data
          const importedSize = initialData.teamASquad.length;
          setSquadSize(importedSize);
          
          setTeamAPlayers([...initialData.teamASquad]);
          setTeamBPlayers([...initialData.teamBSquad]);
      }
  }, [initialData]);

  // Handle dynamic resizing of squad arrays
  const handleSquadSizeChange = (newSize: number) => {
      if (newSize < 2 || newSize > 25) return; // Limits
      setSquadSize(newSize);

      // Resize Team A
      setTeamAPlayers(prev => {
          if (newSize > prev.length) {
              // Add empty slots
              return [...prev, ...Array(newSize - prev.length).fill('')];
          } else {
              // Trim end
              return prev.slice(0, newSize);
          }
      });

      // Resize Team B
      setTeamBPlayers(prev => {
          if (newSize > prev.length) {
              return [...prev, ...Array(newSize - prev.length).fill('')];
          } else {
              return prev.slice(0, newSize);
          }
      });

      // Adjust captain index if it falls out of range
      if (teamACaptainIndex >= newSize) setTeamACaptainIndex(0);
      if (teamBCaptainIndex >= newSize) setTeamBCaptainIndex(0);
  };

  const handleLoadSavedTeam = (teamId: string, isTeamA: boolean) => {
    if (!teamId || !userTeams) return;
    const team = userTeams.find(t => t.id === teamId);
    if (!team) return;

    if (team.roster.length > squadSize) {
      handleSquadSizeChange(team.roster.length);
    }

    if (isTeamA) {
      setTeamAName(team.name);
      setTeamAPlayers(prev => {
        const newArr = [...prev];
        team.roster.forEach((player, i) => { if (i < newArr.length) newArr[i] = player; });
        return newArr;
      });
    } else {
      setTeamBName(team.name);
      setTeamBPlayers(prev => {
        const newArr = [...prev];
        team.roster.forEach((player, i) => { if (i < newArr.length) newArr[i] = player; });
        return newArr;
      });
    }
    toast(`${team.name} loaded successfully`, 'success');
  };

  const handlePlayerChange = (team: 'A' | 'B', index: number, value: string) => {
    if (team === 'A') {
      const newPlayers = [...teamAPlayers];
      newPlayers[index] = value;
      setTeamAPlayers(newPlayers);
    } else {
      const newPlayers = [...teamBPlayers];
      newPlayers[index] = value;
      setTeamBPlayers(newPlayers);
    }
  };

  const insertProfile = (team: 'A' | 'B', index: number) => {
      if (!userProfile) return;
      handlePlayerChange(team, index, userProfile.name);
  }
  const buildTeams = () => {
    if (!teamAName || !teamBName) { toast('Team names are required', 'error'); return null; }
    
    const teamA = createTeam(teamAName, 'team_a');
    const teamB = createTeam(teamBName, 'team_b');

    const getAvatar = (name: string) => (userProfile && userProfile.name === name) ? userProfile.avatar : undefined;

    teamA.players = teamAPlayers.map((name, i) => {
        const finalName = name || `Player A${i+1}`;
        return createPlayer(finalName, 'team_a', i === teamACaptainIndex, getAvatar(finalName));
    });

    teamB.players = teamBPlayers.map((name, i) => {
        const finalName = name || `Player B${i+1}`;
        return createPlayer(finalName, 'team_b', i === teamBCaptainIndex, getAvatar(finalName));
    });

    return { teamA, teamB };
  };

  const handleSubmit = () => {
    const teams = buildTeams();
    if (!teams) return;
    onMatchCreate(teams.teamA, teams.teamB, overs, youtubeUrl.trim());
  };

  const handleSchedule = () => {
    if (!scheduleDate) {
        toast('Please select a date and time to schedule the match', 'error');
        return;
    }
    const dateMs = new Date(scheduleDate).getTime();
    if (dateMs < Date.now()) {
        toast('Scheduled time must be in the future', 'error');
        return;
    }
    const teams = buildTeams();
    if (!teams) return;
    if (onScheduleMatch) onScheduleMatch(teams.teamA, teams.teamB, overs, dateMs, youtubeUrl.trim());
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-2xl mt-4 md:mt-10 border border-gray-300">
      <h2 className="text-2xl md:text-3xl font-bold text-accent mb-6 md:mb-8 flex items-center gap-3 pb-4 border-b">
        <Users className="w-6 h-6 md:w-8 md:h-8" />
        {initialData ? 'Series Match Setup' : 'New Match Setup'}
      </h2>

      {step === 1 && (
        <div className="space-y-6 md:space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border-2 border-gray-200 hover:border-accent/30 transition-colors">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm md:text-base font-bold text-gray-700">Team 1 Name</label>
                {userTeams && userTeams.length > 0 && (
                  <select 
                    onChange={e => handleLoadSavedTeam(e.target.value, true)}
                    className="text-xs bg-white border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-accent"
                  >
                    <option value="">+ Load Saved Team</option>
                    {userTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full p-3 md:p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-base md:text-lg font-semibold text-black bg-white placeholder-gray-400"
                placeholder="Enter Team 1 Name"
              />
            </div>
            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border-2 border-gray-200 hover:border-accent/30 transition-colors">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm md:text-base font-bold text-gray-700">Team 2 Name</label>
                {userTeams && userTeams.length > 0 && (
                  <select 
                    onChange={e => handleLoadSavedTeam(e.target.value, false)}
                    className="text-xs bg-white border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-accent"
                  >
                    <option value="">+ Load Saved Team</option>
                    {userTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full p-3 md:p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-base md:text-lg font-semibold text-black bg-white placeholder-gray-400"
                placeholder="Enter Team 2 Name"
              />
            </div>
          </div>

          {/* Configuration Row: Overs & Players */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            
            {/* Overs Selector */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border-2 border-gray-200 flex flex-col">
                <label className="block text-sm md:text-base font-bold text-gray-700 mb-3">Overs per Innings</label>
                <div className="flex flex-wrap gap-2 mb-3">
                {[5, 10, 15, 20].map(o => (
                    <button
                    key={o}
                    onClick={() => setOvers(o)}
                    className={`min-w-[2.5rem] px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                        overs === o 
                        ? 'bg-accent text-white shadow-lg ring-2 ring-offset-1 ring-accent' 
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
                    }`}
                    >
                    {o}
                    </button>
                ))}
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border-2 border-gray-300 mt-auto w-fit">
                    <span className="text-xs font-semibold text-gray-500">Custom:</span>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={overs}
                        onChange={(e) => setOvers(parseInt(e.target.value) || 0)}
                        className="w-12 p-1 border-b-2 border-gray-300 text-center font-bold text-base text-black bg-transparent focus:border-accent outline-none"
                    />
                </div>
            </div>

            {/* Squad Size Selector */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border-2 border-gray-200 flex flex-col">
                <label className="block text-sm md:text-base font-bold text-gray-700 mb-3">Players per Team</label>
                <div className="flex items-center justify-center gap-3 sm:gap-5 flex-1">
                    <button 
                        onClick={() => handleSquadSizeChange(squadSize - 1)}
                        className="p-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                        disabled={squadSize <= 2}
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    
                    <div className="text-center">
                        <span className="text-4xl md:text-5xl font-black text-accent leading-none">{squadSize}</span>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Players</div>
                    </div>

                    <button 
                        onClick={() => handleSquadSizeChange(squadSize + 1)}
                        className="p-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-200 hover:text-green-500 transition-colors"
                        disabled={squadSize >= 25}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 mt-4 md:mt-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                ⚙️ Advanced Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="p-3 bg-white border border-gray-200 rounded-lg focus-within:border-accent transition-colors">
                  <label className="font-bold text-gray-800 text-sm block mb-1">YouTube Livestream URL</label>
                  <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full text-sm outline-none bg-transparent" />
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4">
             <button
              onClick={() => setStep(2)}
              className="w-full md:w-auto px-10 py-4 bg-accent text-white rounded-xl font-bold text-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Next: Select Squads <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-sm flex items-center gap-2 w-full md:w-auto">
                    <Crown className="w-4 h-4 flex-shrink-0" />
                    <span>Tap Crown to select captain.</span>
                </div>
                <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full self-end md:self-auto">
                    {squadSize} Players per side
                </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Team A Squad */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-200">
                <div className="flex items-center border-b border-gray-300 pb-3 mb-4">
                    <div className="w-10 flex justify-center" title="Select Captain">
                        <Crown className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-lg md:text-xl text-accent ml-2 truncate">{teamAName}</h3>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                  {teamAPlayers.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                       <button
                        onClick={() => setTeamACaptainIndex(idx)}
                        className={`p-2 rounded-md transition-all flex-shrink-0 ${teamACaptainIndex === idx ? 'text-yellow-500 bg-yellow-100 ring-1 ring-yellow-400' : 'text-gray-300 hover:bg-gray-200'}`}
                        title="Make Captain"
                      >
                        <Crown className={`w-5 h-5 md:w-6 md:h-6 ${teamACaptainIndex === idx ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-xs text-gray-500 font-bold min-w-[1.25rem] text-center">#{idx + 1}</span>
                      <div className="relative flex-1">
                        <PlayerAutosuggestInput
                            value={player}
                            onChange={(val) => handlePlayerChange('A', idx, val)}
                            dbPlayers={dbPlayers}
                            className="w-full py-2.5 px-3 pr-8 md:p-3 md:pr-10 text-sm md:text-base font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-black bg-white placeholder-gray-400 transition-all shadow-sm"
                            placeholder={`Player Name`}
                        />
                        {/* Clear Button */}
                        {player && (
                             <button 
                                onClick={() => handlePlayerChange('A', idx, '')}
                                className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                title="Clear Name"
                            >
                                <X className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        )}
                         {userProfile && !player && (
                            <button 
                                onClick={() => insertProfile('A', idx)}
                                className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:bg-blue-50 p-1.5 rounded-full"
                                title="Add Me"
                            >
                                <User className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B Squad */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-200">
                <div className="flex items-center border-b border-gray-300 pb-3 mb-4">
                    <div className="w-10 flex justify-center" title="Select Captain">
                        <Crown className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-lg md:text-xl text-accent ml-2 truncate">{teamBName}</h3>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                  {teamBPlayers.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <button
                        onClick={() => setTeamBCaptainIndex(idx)}
                        className={`p-2 rounded-md transition-all flex-shrink-0 ${teamBCaptainIndex === idx ? 'text-yellow-500 bg-yellow-100 ring-1 ring-yellow-400' : 'text-gray-300 hover:bg-gray-200'}`}
                        title="Make Captain"
                      >
                        <Crown className={`w-5 h-5 md:w-6 md:h-6 ${teamBCaptainIndex === idx ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-xs text-gray-500 font-bold min-w-[1.25rem] text-center">#{idx + 1}</span>
                      <div className="relative flex-1">
                        <PlayerAutosuggestInput
                            value={player}
                            onChange={(val) => handlePlayerChange('B', idx, val)}
                            dbPlayers={dbPlayers}
                            className="w-full py-2.5 px-3 pr-8 md:p-3 md:pr-10 text-sm md:text-base font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-black bg-white placeholder-gray-400 transition-all shadow-sm"
                            placeholder={`Player Name`}
                        />
                        {/* Clear Button */}
                         {player && (
                             <button 
                                onClick={() => handlePlayerChange('B', idx, '')}
                                className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                title="Clear Name"
                            >
                                <X className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        )}
                        {userProfile && !player && (
                            <button 
                                onClick={() => insertProfile('B', idx)}
                                className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:bg-blue-50 p-1.5 rounded-full"
                                title="Add Me"
                            >
                                <User className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

            <div className="flex flex-col md:flex-row justify-between pt-6 border-t border-gray-200 dark:border-slate-700 mt-4 gap-4">
             <button
              onClick={() => setStep(1)}
              className="px-6 md:px-8 py-3 text-gray-600 dark:text-gray-300 font-bold hover:text-accent dark:hover:text-accent hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm md:text-base self-start"
            >
              Back
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              {onScheduleMatch && (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                      {showScheduleInput ? (
                          <>
                              <input 
                                  type="datetime-local" 
                                  value={scheduleDate}
                                  onChange={e => setScheduleDate(e.target.value)}
                                  className="p-2 border border-gray-300 rounded-lg text-sm outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                              />
                              <button onClick={handleSchedule} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm active:scale-95 transition-transform flex items-center gap-1 shadow-md">
                                  Confirm <Bookmark className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setShowScheduleInput(false)} className="px-2 text-gray-500 hover:text-red-500 transition-colors">
                                  <X className="w-5 h-5" />
                              </button>
                          </>
                      ) : (
                          <button
                              onClick={() => setShowScheduleInput(true)}
                              className="px-4 md:px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                          >
                              Schedule Match <Calendar className="w-4 h-4" />
                          </button>
                      )}
                  </div>
              )}
              <button
                onClick={handleSubmit}
                className="px-8 md:px-10 py-3 md:py-4 bg-success text-white rounded-xl font-bold text-base md:text-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
              >
                Start Match <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
