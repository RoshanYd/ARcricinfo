import React, { useState } from 'react';
import { Team, Player, UserProfile } from '../types';
import { createTeam, createPlayer } from '../utils/cricketLogic';
import { Users, UserPlus, PlayCircle, Trash2, Crown, User } from 'lucide-react';

interface MatchSetupProps {
  onMatchCreate: (teamA: Team, teamB: Team, overs: number) => void;
  userProfile: UserProfile | null;
}

export const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchCreate, userProfile }) => {
  const [teamAName, setTeamAName] = useState('Warriors');
  const [teamBName, setTeamBName] = useState('Titans');
  const [overs, setOvers] = useState(10);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Initialize with empty strings for easier manual entry
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(Array(11).fill(''));
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(Array(11).fill(''));
  
  // Captain Selection Indices
  const [teamACaptainIndex, setTeamACaptainIndex] = useState(0);
  const [teamBCaptainIndex, setTeamBCaptainIndex] = useState(0);

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

  const handleSubmit = () => {
    // Validation
    if (!teamAName || !teamBName) return alert("Team names required");
    
    const teamA = createTeam(teamAName, 'team_a');
    const teamB = createTeam(teamBName, 'team_b');

    // Helper to attach avatar if name matches profile
    const getAvatar = (name: string) => (userProfile && userProfile.name === name) ? userProfile.avatar : undefined;

    teamA.players = teamAPlayers.map((name, i) => {
        const finalName = name || `Player A${i+1}`;
        return createPlayer(finalName, 'team_a', i === teamACaptainIndex, getAvatar(finalName));
    });

    teamB.players = teamBPlayers.map((name, i) => {
        const finalName = name || `Player B${i+1}`;
        return createPlayer(finalName, 'team_b', i === teamBCaptainIndex, getAvatar(finalName));
    });

    onMatchCreate(teamA, teamB, overs);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-2xl mt-10 border border-gray-300">
      <h2 className="text-3xl font-bold text-accent mb-8 flex items-center gap-3 pb-4 border-b">
        <Users className="w-8 h-8" />
        New Match Setup
      </h2>

      {step === 1 && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 hover:border-accent/30 transition-colors">
              <label className="block text-base font-bold text-gray-700 mb-2">Team 1 Name</label>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-lg font-semibold text-black bg-white placeholder-gray-400"
                placeholder="Enter Team 1 Name"
              />
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 hover:border-accent/30 transition-colors">
              <label className="block text-base font-bold text-gray-700 mb-2">Team 2 Name</label>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-lg font-semibold text-black bg-white placeholder-gray-400"
                placeholder="Enter Team 2 Name"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
            <label className="block text-base font-bold text-gray-700 mb-3">Overs per Innings</label>
            <div className="flex flex-wrap gap-4 items-center">
              {[5, 10, 15, 20, 50].map(o => (
                <button
                  key={o}
                  onClick={() => setOvers(o)}
                  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                    overs === o 
                    ? 'bg-accent text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-accent' 
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {o}
                </button>
              ))}
               <div className="flex items-center gap-3 ml-4 bg-white p-2 rounded-lg border-2 border-gray-300">
                   <span className="text-sm font-semibold text-gray-600">Custom:</span>
                   <input
                    type="number"
                    min="1"
                    max="100"
                    value={overs}
                    onChange={(e) => setOvers(parseInt(e.target.value) || 0)}
                    className="w-24 p-2 border-b-2 border-gray-300 text-center font-bold text-xl text-black bg-transparent focus:border-accent outline-none"
                   />
               </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
             <button
              onClick={() => setStep(2)}
              className="px-10 py-4 bg-accent text-white rounded-xl font-bold text-lg hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Next: Select Squads <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 text-blue-800 text-sm flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span>Tap the Crown to select captain.</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Team A Squad */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center border-b border-gray-300 pb-3 mb-4">
                    <h3 className="font-bold text-xl text-accent">{teamAName}</h3>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Captain</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {teamAPlayers.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                       <button
                        onClick={() => setTeamACaptainIndex(idx)}
                        className={`p-2 rounded-md transition-all ${teamACaptainIndex === idx ? 'text-yellow-500 bg-yellow-100' : 'text-gray-300 hover:bg-gray-200'}`}
                      >
                        <Crown className={`w-5 h-5 ${teamACaptainIndex === idx ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-xs text-gray-500 font-bold w-5">#{idx + 1}</span>
                      <div className="relative flex-1">
                        <input
                            type="text"
                            value={player}
                            onChange={(e) => handlePlayerChange('A', idx, e.target.value)}
                            className="w-full p-3 pr-10 text-base font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-black bg-white placeholder-gray-400 transition-all"
                            placeholder={`Player Name`}
                        />
                         {userProfile && !player && (
                            <button 
                                onClick={() => insertProfile('A', idx)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:bg-blue-50 p-1 rounded-full"
                                title="Add Me"
                            >
                                <User className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B Squad */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center border-b border-gray-300 pb-3 mb-4">
                    <h3 className="font-bold text-xl text-accent">{teamBName}</h3>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Captain</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {teamBPlayers.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <button
                        onClick={() => setTeamBCaptainIndex(idx)}
                        className={`p-2 rounded-md transition-all ${teamBCaptainIndex === idx ? 'text-yellow-500 bg-yellow-100' : 'text-gray-300 hover:bg-gray-200'}`}
                      >
                        <Crown className={`w-5 h-5 ${teamBCaptainIndex === idx ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-xs text-gray-500 font-bold w-5">#{idx + 1}</span>
                      <div className="relative flex-1">
                        <input
                            type="text"
                            value={player}
                            onChange={(e) => handlePlayerChange('B', idx, e.target.value)}
                            className="w-full p-3 pr-10 text-base font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-black bg-white placeholder-gray-400 transition-all"
                            placeholder={`Player Name`}
                        />
                        {userProfile && !player && (
                            <button 
                                onClick={() => insertProfile('B', idx)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:bg-blue-50 p-1 rounded-full"
                                title="Add Me"
                            >
                                <User className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           <div className="flex justify-between pt-6 border-t border-gray-200 mt-4">
             <button
              onClick={() => setStep(1)}
              className="px-8 py-3 text-gray-600 font-bold hover:text-accent hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-10 py-4 bg-success text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Match <PlayCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};