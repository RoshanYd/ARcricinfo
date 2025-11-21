import React, { useState, useEffect } from 'react';
import { Match, MatchStatus, Team, DismissalType, ExtraType, Ball, Player, AnimationEvent, UserProfile } from './types';
import { MatchSetup } from './components/MatchSetup';
import { MatchDashboard } from './components/MatchDashboard';
import { LiveScorer } from './components/LiveScorer';
import { AnimationOverlay } from './components/AnimationOverlay';
import { determineManOfTheMatch, createTeam } from './utils/cricketLogic';
import { History, Trophy, ChevronLeft, Search, Menu, X, Settings, Users, Activity, User, LogIn, LogOut, Camera, Upload } from 'lucide-react';

// --- Helper Components ---

const PlayerSelectModal = ({ players, label, onSelect, variant = 'BATSMAN', disabledIds = [] }: { players: Player[], label: string, onSelect: (id: string) => void, variant?: 'BATSMAN' | 'BOWLER', disabledIds?: string[] }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
            <h3 className="text-xl font-bold mb-4 text-accent">Select {label}</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
                {players.map(p => {
                    const isBatsmanOut = variant === 'BATSMAN' && p.isOut;
                    const isDisabledByProp = disabledIds.includes(p.id);
                    const isDisabled = isBatsmanOut || isDisabledByProp;
                    
                    let statusText = '';
                    if (isBatsmanOut) statusText = '(Out)';
                    else if (isDisabledByProp && variant === 'BOWLER') statusText = '(Bowled Last Over)';

                    return (
                        <button 
                            key={p.id} 
                            onClick={() => onSelect(p.id)}
                            disabled={isDisabled}
                            className={`w-full p-3 text-left rounded-lg border flex items-center gap-2 ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-blue-50 border-gray-200 text-gray-900'}`}
                        >
                             {p.avatar && <img src={p.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-300" />}
                            {p.name} <span className="text-xs font-bold ml-1">{statusText}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
);

const TossInterface = ({ match, onComplete }: { match: Match, onComplete: (winnerId: string, batFirst: boolean) => void }) => {
    const [winner, setWinner] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-secondary/20 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                <h2 className="text-3xl font-bold text-accent mb-6">Match Toss</h2>
                {!winner ? (
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">Who won the toss?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setWinner(match.teamA.id)} className="py-4 border-2 border-accent rounded-xl font-bold hover:bg-accent hover:text-white transition-colors">
                                {match.teamA.name}
                            </button>
                            <button onClick={() => setWinner(match.teamB.id)} className="py-4 border-2 border-accent rounded-xl font-bold hover:bg-accent hover:text-white transition-colors">
                                {match.teamB.name}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <p className="text-lg font-medium text-gray-700">
                            <span className="font-bold text-accent">
                                {winner === match.teamA.id ? match.teamA.name : match.teamB.name}
                            </span> won the toss.
                        </p>
                        <p className="text-gray-600">What do they choose?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => onComplete(winner, true)} className="py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg">Bat First</button>
                            <button onClick={() => onComplete(winner, false)} className="py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg">Bowl First</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const Navbar = ({ currentView, setView, hasActiveMatch, userProfile }: { currentView: string, setView: (v: 'HOME' | 'MATCH' | 'HISTORY' | 'PROFILE') => void, hasActiveMatch: boolean, userProfile: UserProfile | null }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const NavItem = ({ view, label, icon: Icon, onClick }: any) => (
        <button 
            onClick={() => {
                if (onClick) onClick();
                else setView(view);
                setIsMenuOpen(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${currentView === view && !onClick ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/5 hover:text-white'}`}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </button>
    );

    return (
        <nav className="bg-accent text-white shadow-lg sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('HOME')}>
                        <div className="bg-yellow-500 p-1.5 rounded-lg text-accent">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-wider">ARcricinfo</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        <NavItem view="HOME" label="Home" icon={Trophy} />
                        <NavItem view="HISTORY" label="History" icon={History} />
                        <div className="h-6 w-px bg-white/20 mx-2"></div>
                         {/* Placeholder links for future features */}
                        <NavItem view="TEAMS" label="Teams" icon={Users} onClick={() => alert("Team Manager coming soon!")} />
                        
                        {hasActiveMatch && currentView !== 'MATCH' && (
                            <button 
                                onClick={() => setView('MATCH')}
                                className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-sm flex items-center gap-2 animate-pulse"
                            >
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                Live Match
                            </button>
                        )}

                        <div className="ml-4 flex items-center">
                            <button onClick={() => setView('PROFILE')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                                {userProfile && userProfile.avatar ? (
                                    <img src={userProfile.avatar} alt="Profile" className="w-6 h-6 rounded-full border border-white/30 object-cover" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                                <span className="text-sm font-medium">{userProfile ? userProfile.name.split(' ')[0] : 'Login'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                         {hasActiveMatch && currentView !== 'MATCH' && (
                            <button 
                                onClick={() => setView('MATCH')}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-full font-bold text-xs flex items-center gap-1.5 animate-pulse"
                            >
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                Live
                            </button>
                        )}
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg">
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-accent border-t border-white/10 animate-fade-in">
                    <div className="flex flex-col p-4 gap-2">
                        <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-white/5 rounded-lg" onClick={() => { setView('PROFILE'); setIsMenuOpen(false); }}>
                             {userProfile && userProfile.avatar ? (
                                    <img src={userProfile.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-white/30 object-cover" />
                                ) : (
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><User className="w-6 h-6" /></div>
                                )}
                                <div>
                                    <div className="font-bold">{userProfile ? userProfile.name : 'Guest User'}</div>
                                    <div className="text-xs text-white/60">{userProfile ? 'View Profile' : 'Tap to Login'}</div>
                                </div>
                        </div>
                        <NavItem view="HOME" label="Home" icon={Trophy} />
                        <NavItem view="HISTORY" label="Match History" icon={History} />
                        <div className="h-px bg-white/10 my-2"></div>
                        <NavItem view="TEAMS" label="Manage Teams" icon={Users} onClick={() => alert("Team Manager coming soon!")} />
                        {hasActiveMatch && (
                             <button 
                                onClick={() => {
                                    setView('MATCH');
                                    setIsMenuOpen(false);
                                }}
                                className="mt-2 w-full py-3 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                <Activity className="w-4 h-4" /> Return to Live Match
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

const ProfileView = ({ user, onLogin, onLogout }: { user: UserProfile | null, onLogin: (u: UserProfile) => void, onLogout: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [customAvatar, setCustomAvatar] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleManualLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !email) return;
        
        const finalAvatar = customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

        onLogin({
            name,
            email,
            avatar: finalAvatar
        });
    }

    if (user) {
        return (
            <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-lg overflow-hidden border border-secondary/30 animate-fade-in">
                <div className="bg-accent p-6 text-center">
                    <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-md mb-4 object-cover" />
                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                    <p className="text-blue-100">{user.email}</p>
                </div>
                <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-bold text-gray-700 mb-2">Stats & Records</h3>
                        <p className="text-gray-500 text-sm text-center italic">No matches played yet.</p>
                    </div>
                    <button onClick={onLogout} className="w-full py-3 border border-red-500 text-red-500 font-bold rounded-lg hover:bg-red-50 flex items-center justify-center gap-2">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-secondary/30 animate-fade-in">
             <div className="text-center mb-8">
                <div className="relative inline-block">
                    {customAvatar ? (
                        <img src={customAvatar} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-sm mx-auto mb-4" />
                    ) : (
                        <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent border-4 border-gray-100">
                            <User className="w-10 h-10" />
                        </div>
                    )}
                    <label className="absolute bottom-4 right-0 bg-accent text-white p-1.5 rounded-full cursor-pointer shadow-md hover:bg-accent/90 transition-colors">
                        <Camera className="w-4 h-4" />
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Scorer Profile</h2>
                <p className="text-gray-500">Create a profile to appear in scorecards</p>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-gray-900 bg-white placeholder-gray-500"
                        placeholder="Enter your name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-gray-900 bg-white placeholder-gray-500"
                        placeholder="name@example.com"
                    />
                </div>
                
                <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-600">
                         <Upload className="w-5 h-5 text-gray-400" />
                         <span className="text-sm font-medium">Upload Profile Image (Optional)</span>
                         <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                </div>

                <button type="submit" className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 mt-4">
                    Save Profile
                </button>
            </form>
        </div>
    )
}

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'HOME' | 'MATCH' | 'HISTORY' | 'PROFILE'>('HOME');
  const [match, setMatch] = useState<Match | null>(null);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [animEvent, setAnimEvent] = useState<AnimationEvent>({ type: 'NONE', message: '' });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Modal controls
  const [needsStriker, setNeedsStriker] = useState(false);
  const [needsNonStriker, setNeedsNonStriker] = useState(false);
  const [needsBowler, setNeedsBowler] = useState(false);

  // Load history and profile on mount
  useEffect(() => {
      const savedHistory = localStorage.getItem('arcricinfo_history');
      if (savedHistory) setMatchHistory(JSON.parse(savedHistory));

      const savedProfile = localStorage.getItem('arcricinfo_profile');
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
  }, []);

  // Save history when match completes
  const saveMatchToHistory = (completedMatch: Match) => {
      const updatedHistory = [completedMatch, ...matchHistory];
      setMatchHistory(updatedHistory);
      localStorage.setItem('arcricinfo_history', JSON.stringify(updatedHistory));
  };

  const handleLogin = (profile: UserProfile) => {
      setUserProfile(profile);
      localStorage.setItem('arcricinfo_profile', JSON.stringify(profile));
      setView('HOME');
  }

  const handleLogout = () => {
      setUserProfile(null);
      localStorage.removeItem('arcricinfo_profile');
  }

  const startMatch = (teamA: Team, teamB: Team, overs: number) => {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      date: Date.now(),
      status: MatchStatus.TOSS,
      totalOvers: overs,
      teamA,
      teamB,
      currentInnings: 1,
      balls: []
    };
    setMatch(newMatch);
    setView('MATCH');
  };

  const handleTossComplete = (winnerId: string, batFirst: boolean) => {
      if (!match) return;
      
      const battingTeamId = batFirst ? winnerId : (winnerId === match.teamA.id ? match.teamB.id : match.teamA.id);
      const isTeamABatting = battingTeamId === match.teamA.id;
      
      setMatch(prev => {
          if(!prev) return null;
          return {
              ...prev,
              status: MatchStatus.LIVE,
              tossWinnerId: winnerId,
              battingFirstId: battingTeamId,
              teamA: { ...prev.teamA, isBatting: isTeamABatting },
              teamB: { ...prev.teamB, isBatting: !isTeamABatting },
          }
      });

      // Trigger initial player selection
      setNeedsStriker(true);
      // Non striker triggered after striker selected
      setNeedsBowler(true);
  };

  // --- Scoring Logic Engine ---

  const updateMatchState = (runs: number, extra: ExtraType, dismissal: DismissalType) => {
      if (!match) return;
      
      // Deep copy match state
      const m = JSON.parse(JSON.stringify(match)) as Match;
      const battingTeam = m.teamA.isBatting ? m.teamA : m.teamB;
      const bowlingTeam = m.teamA.isBatting ? m.teamB : m.teamA;
      
      const striker = battingTeam.players.find(p => p.id === m.currentStrikerId);
      const bowler = bowlingTeam.players.find(p => p.id === m.currentBowlerId);
      
      if (!striker || !bowler) return; // Should not happen

      // 1. Create Ball Object
      const isLegalBall = extra !== ExtraType.WIDE && extra !== ExtraType.NO_BALL;
      const ballRuns = runs; 
      const extraRuns = (extra === ExtraType.WIDE || extra === ExtraType.NO_BALL) ? 1 + runs : (extra === ExtraType.BYE || extra === ExtraType.LEG_BYE) ? runs : 0;
      const totalRunsForBall = (extra === ExtraType.WIDE || extra === ExtraType.NO_BALL) ? 1 + runs : runs; // For W/NB, user clicks runs taken, +1 for extra

      const newBall: Ball = {
          id: crypto.randomUUID(),
          overNumber: Math.floor(battingTeam.overs / 6),
          ballNumber: (battingTeam.overs % 6) + 1,
          bowlerId: bowler.id,
          strikerId: striker.id,
          nonStrikerId: m.currentNonStrikerId || '',
          runsScored: (extra === ExtraType.WIDE) ? 0 : runs, // Runs off bat only if not wide
          extraType: extra,
          extraRuns: extraRuns,
          isWicket: dismissal !== DismissalType.NONE,
          dismissalType: dismissal,
          dismissedPlayerId: dismissal !== DismissalType.NONE ? striker.id : undefined,
          timestamp: Date.now()
      };

      m.balls.push(newBall);

      // 2. Update Stats
      battingTeam.totalRuns += totalRunsForBall;
      battingTeam.extras += (extra !== ExtraType.NONE ? totalRunsForBall : 0); // Simplified extras tracking
      if (isLegalBall) {
          battingTeam.overs++; // Actually balls count
          bowler.oversBowled++; 
      }
      
      bowler.runsConceded += totalRunsForBall;
      if (dismissal !== DismissalType.NONE && dismissal !== DismissalType.RUN_OUT) {
          bowler.wickets++;
      }

      if (extra === ExtraType.NONE || extra === ExtraType.NO_BALL) {
         // Runs go to batsman
         striker.runs += runs;
         if (isLegalBall) striker.ballsFaced++; // NB doesn't count as ball faced usually, but free hit logic is complex. standard: NB is ball faced? No. 
         // Correction: NB is NOT a ball faced.
         if (extra === ExtraType.NO_BALL) {
             // Do not increment balls faced
         } else {
             // Normal ball
         }
         if (runs === 4) {
             striker.fours++;
             setAnimEvent({ type: 'FOUR', message: 'Boundary!' });
         }
         if (runs === 6) {
             striker.sixes++;
             setAnimEvent({ type: 'SIX', message: 'Huge Six!' });
         }
      }

      // 3. Handle Wicket
      if (dismissal !== DismissalType.NONE) {
          battingTeam.wickets++;
          striker.isOut = true;
          striker.dismissalType = dismissal;
          setAnimEvent({ type: 'WICKET', message: `${striker.name} is OUT!` });
          m.currentStrikerId = undefined; // Needs selection
      }

      // 4. Strike Rotation
      // Rotate if odd runs scored off bat/byes (not boundary)
      // Careful: If 1 run + Run Out, logic varies. Assuming simple case.
      if (runs % 2 !== 0) {
          const temp = m.currentStrikerId;
          m.currentStrikerId = m.currentNonStrikerId;
          m.currentNonStrikerId = temp;
      }

      // 5. Over Completion
      if (isLegalBall && battingTeam.overs % 6 === 0) {
          // Swap strike at end of over
          const temp = m.currentStrikerId;
          m.currentStrikerId = m.currentNonStrikerId;
          m.currentNonStrikerId = temp;
          m.currentBowlerId = undefined; // Needs selection
      }

      // 6. Check Innings End / Match End
      let matchEnded = false;
      let inningsEnded = false;
      const target = (m.currentInnings === 2) ? (bowlingTeam.totalRuns + 1) : 99999;

      // All out
      if (battingTeam.wickets >= 10) {
          inningsEnded = true;
      }
      // Overs done
      if (battingTeam.overs >= m.totalOvers * 6) {
          inningsEnded = true;
      }
      // Target chased (Innings 2)
      if (m.currentInnings === 2 && battingTeam.totalRuns >= target) {
          matchEnded = true;
          m.winningTeamId = battingTeam.id;
      }

      if (matchEnded) {
          m.status = MatchStatus.COMPLETED;
          const motmId = determineManOfTheMatch(m);
          m.manOfTheMatchId = motmId;
          const winnerName = m.winningTeamId === m.teamA.id ? m.teamA.name : m.teamB.name;
          setAnimEvent({ type: 'WIN', message: `${winnerName} Wins!` });
          saveMatchToHistory(m);
      } else if (inningsEnded) {
          if (m.currentInnings === 1) {
              const targetScore = battingTeam.totalRuns + 1;
              
              // Switch innings
              m.currentInnings = 2;
              // Swap batting status
              m.teamA.isBatting = !m.teamA.isBatting;
              m.teamB.isBatting = !m.teamB.isBatting;
              // Reset current players
              m.currentStrikerId = undefined;
              m.currentNonStrikerId = undefined;
              m.currentBowlerId = undefined;
              setNeedsStriker(true);
              setNeedsBowler(true);
              
              // Trigger Animation instead of alert
              setAnimEvent({ type: 'INNINGS_BREAK', message: `Target: ${targetScore}` });
          } else {
              // Innings 2 ended but target not reached (Defending team wins)
              m.status = MatchStatus.COMPLETED;
              m.winningTeamId = bowlingTeam.id;
              const motmId = determineManOfTheMatch(m);
              m.manOfTheMatchId = motmId;
              const winnerName = bowlingTeam.name;
              setAnimEvent({ type: 'WIN', message: `${winnerName} Wins!` });
              saveMatchToHistory(m);
          }
      } else {
          // Intermediate state checks
          if (dismissal !== DismissalType.NONE && battingTeam.wickets < 10) {
              setNeedsStriker(true);
          }
          if (isLegalBall && battingTeam.overs % 6 === 0 && !matchEnded && !inningsEnded) {
              setNeedsBowler(true);
          }
      }

      setMatch(m);
  };

  // --- Selectors ---

  const handleStrikerSelect = (id: string) => {
      if (!match) return;
      const m = { ...match };
      m.currentStrikerId = id;
      setMatch(m);
      setNeedsStriker(false);
      if (!m.currentNonStrikerId) setNeedsNonStriker(true);
  };

  const handleNonStrikerSelect = (id: string) => {
      if (!match) return;
      const m = { ...match };
      m.currentNonStrikerId = id;
      setMatch(m);
      setNeedsNonStriker(false);
  };

  const handleBowlerSelect = (id: string) => {
      if (!match) return;
      const m = { ...match };
      m.currentBowlerId = id;
      setMatch(m);
      setNeedsBowler(false);
  };

  // --- Render Logic ---

  const activeBattingTeam = match ? (match.teamA.isBatting ? match.teamA : match.teamB) : null;
  const activeBowlingTeam = match ? (match.teamA.isBatting ? match.teamB : match.teamA) : null;

  const availableBatsmen = activeBattingTeam 
    ? activeBattingTeam.players.filter(p => !p.isOut && p.id !== match?.currentStrikerId && p.id !== match?.currentNonStrikerId)
    : [];

  const availableBowlers = activeBowlingTeam
    ? activeBowlingTeam.players.filter(p => p.id !== match?.currentBowlerId) 
    : [];

  // Determine previous bowler to prevent consecutive overs
  const lastBall = match?.balls && match.balls.length > 0 ? match.balls[match.balls.length - 1] : null;
  const previousBowlerId = lastBall?.bowlerId || '';

  // Filter History
  const filteredHistory = matchHistory.filter(m => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const mDate = new Date(m.date);
    
    const dateFormats = [
        mDate.toLocaleDateString(), 
        mDate.toDateString().toLowerCase(),
        mDate.toISOString().split('T')[0], 
        `${mDate.getDate()}`,
        mDate.toLocaleString('default', { month: 'long' }).toLowerCase(),
        mDate.toLocaleString('default', { month: 'short' }).toLowerCase()
    ];

    const dateMatch = dateFormats.some(d => d.includes(query));
    const teamMatch = m.teamA.name.toLowerCase().includes(query) || 
                      m.teamB.name.toLowerCase().includes(query);
    
    return teamMatch || dateMatch;
  });

  const hasActiveMatch = match !== null && match.status !== MatchStatus.COMPLETED;

  return (
    <div className="min-h-screen pb-12">
      <Navbar currentView={view} setView={setView} hasActiveMatch={hasActiveMatch} userProfile={userProfile} />

      <main className="max-w-6xl mx-auto p-4">
        {view === 'PROFILE' && (
            <ProfileView user={userProfile} onLogin={handleLogin} onLogout={handleLogout} />
        )}

        {view === 'HOME' && (
            <div className="space-y-8 animate-fade-in">
                <div className="text-center py-10">
                    <h2 className="text-4xl font-bold text-accent mb-4">Manage Cricket Like a Pro</h2>
                    <p className="text-gray-500 max-w-lg mx-auto">Create matches, score ball-by-ball, and get automated statistics instantly.</p>
                </div>
                
                <div className="flex flex-col md:flex-row justify-center gap-6">
                    <div 
                        className="bg-white p-6 rounded-xl shadow-lg border border-secondary/30 w-full md:w-96 hover:shadow-xl transition-shadow cursor-pointer" 
                        onClick={() => {
                            setMatch(null);
                            setView('MATCH');
                        }}
                    >
                        <div className="h-12 w-12 bg-green-100 text-green-700 rounded-lg flex items-center justify-center mb-4">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">New Match</h3>
                        <p className="text-gray-500 text-sm">Start a fresh game, set up teams, and begin scoring immediately.</p>
                        <button className="mt-4 w-full py-2 bg-accent text-white rounded-lg font-medium">Start Now</button>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-secondary/30 w-full md:w-96 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setView('HISTORY')}>
                        <div className="h-12 w-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mb-4">
                            <History className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Match History</h3>
                        <p className="text-gray-500 text-sm">Review scorecards, player stats, and results from previous games.</p>
                        <button className="mt-4 w-full py-2 border border-accent text-accent rounded-lg font-medium">View Match History</button>
                    </div>
                </div>
            </div>
        )}

        {view === 'MATCH' && !match && (
            <MatchSetup onMatchCreate={startMatch} userProfile={userProfile} />
        )}

        {view === 'MATCH' && match && (
            <>
                {match.status === MatchStatus.TOSS && (
                    <TossInterface match={match} onComplete={handleTossComplete} />
                )}

                {/* Animation Overlay */}
                <AnimationOverlay event={animEvent} onComplete={() => setAnimEvent({ type: 'NONE', message: '' })} />

                {/* Player Selection Modals */}
                {needsStriker && match.status === MatchStatus.LIVE && (
                    <PlayerSelectModal 
                        players={availableBatsmen} 
                        label="Striker" 
                        onSelect={handleStrikerSelect} 
                        variant="BATSMAN"
                    />
                )}
                {needsNonStriker && match.status === MatchStatus.LIVE && (
                    <PlayerSelectModal 
                        players={availableBatsmen} 
                        label="Non-Striker" 
                        onSelect={handleNonStrikerSelect}
                        variant="BATSMAN"
                    />
                )}
                {needsBowler && match.status === MatchStatus.LIVE && (
                    <PlayerSelectModal 
                        players={availableBowlers} 
                        label={activeBattingTeam?.overs === 0 ? "Bowler" : "Next Bowler"}
                        onSelect={handleBowlerSelect} 
                        variant="BOWLER"
                        disabledIds={previousBowlerId ? [previousBowlerId] : []}
                    />
                )}

                {match.status !== MatchStatus.TOSS && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <MatchDashboard match={match} />
                            {match.status === MatchStatus.LIVE && (
                                <LiveScorer 
                                    match={match} 
                                    onScoreUpdate={updateMatchState} 
                                    onPause={() => setView('HOME')}
                                    onMatchEnd={() => {
                                        const m = {...match, status: MatchStatus.COMPLETED};
                                        setMatch(m);
                                        saveMatchToHistory(m);
                                    }}
                                />
                            )}
                            
                            {match.status === MatchStatus.COMPLETED && (
                                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-center">
                                    <h3 className="text-2xl font-bold text-yellow-800 mb-2">Man of the Match</h3>
                                    {match.manOfTheMatchId && (
                                        <div className="text-xl font-medium">
                                            {[...match.teamA.players, ...match.teamB.players].find(p => p.id === match.manOfTheMatchId)?.name}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl shadow-sm h-fit">
                            <h3 className="font-bold text-lg border-b pb-2 mb-4">Match Info</h3>
                            <div className="text-sm space-y-2 text-gray-600">
                                <p><span className="font-semibold">Date:</span> {new Date(match.date).toLocaleDateString()}</p>
                                <p><span className="font-semibold">Overs:</span> {match.totalOvers}</p>
                                <p><span className="font-semibold">Status:</span> {match.status}</p>
                                <div className="mt-4">
                                    <p className="font-semibold mb-1">Teams</p>
                                    <p>{match.teamA.name}</p>
                                    <p>{match.teamB.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {view === 'HISTORY' && (
             <div className="animate-fade-in">
                <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <Search className="text-gray-500 w-6 h-6" />
                    <input 
                        type="text" 
                        placeholder="Search matches by Team (e.g. Warriors) or Date (e.g. Oct 25)..." 
                        className="flex-1 p-3 text-base border-2 border-gray-300 rounded-lg outline-none text-black bg-gray-50 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder-gray-500" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredHistory.length === 0 ? (
                        <div className="col-span-2 text-center text-gray-400 py-12">
                            {matchHistory.length === 0 ? "No match history found." : "No matches found matching your search."}
                        </div>
                    ) : (
                        filteredHistory.map(m => (
                            <div key={m.id} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer" onClick={() => {
                                setMatch(m);
                                setView('MATCH');
                            }}>
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                    <span>{new Date(m.date).toLocaleDateString()}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${m.status === MatchStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-lg font-bold">{m.teamA.name}</div>
                                    <div className="text-sm font-mono bg-gray-50 px-2 rounded">{m.teamA.totalRuns}/{m.teamA.wickets}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-lg font-bold">{m.teamB.name}</div>
                                    <div className="text-sm font-mono bg-gray-50 px-2 rounded">{m.teamB.totalRuns}/{m.teamB.wickets}</div>
                                </div>
                                {m.winningTeamId && (
                                    <div className="mt-3 pt-3 border-t text-sm text-success font-medium">
                                        Winner: {m.winningTeamId === m.teamA.id ? m.teamA.name : m.teamB.name}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
             </div>
        )}
      </main>
    </div>
  );
}