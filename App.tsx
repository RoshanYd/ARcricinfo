import React, { useState, useEffect, useCallback } from 'react';
import { Match, MatchStatus, Team, DismissalType, ExtraType, Ball, Player, AnimationEvent, UserProfile, Series, SuperOverPlayerStats, Tournament, TournamentFixture, PersistentTeam } from './types';
import { MatchSetup } from './components/MatchSetup';
import { MatchDashboard } from './components/MatchDashboard';
import { LiveScorer } from './components/LiveScorer';
import { AnimationOverlay } from './components/AnimationOverlay';
import { AuthScreen } from './components/AuthScreen';
import { PlayersView } from './components/PlayersView';
import { PlayerProfileView } from './components/PlayerProfileView';
import { CommunityBoard } from './components/CommunityBoard';
import { TeamsView } from './components/TeamsView';
import { TournamentSetup } from './components/TournamentSetup';
import { TournamentView } from './components/TournamentView';
import { ShareScorecard } from './components/ShareScorecard';
import { PartnershipsView, computePartnerships } from './components/Partnerships';
import { LiveScoreView } from './components/LiveScoreView';
import { PublicProfileView } from './components/PublicProfileView';
import { BroadcastOverlay } from './components/BroadcastOverlay';
import { WagonWheel } from './components/WagonWheel';
import { MatchAnalytics } from './components/MatchAnalytics';
import { BallTimeline } from './components/BallTimeline';
import { ToastProvider, useToast } from './components/Toast';
import { determineManOfTheMatch } from './utils/cricketLogic';
import { supabase } from './utils/supabase';
import { loadProfile, saveProfile, loadMatches, saveMatch, deleteMatch, loadActiveSeries, loadCompletedSeries, saveSeries, syncPlayersFromMatches, loadAllPlayers, DBPlayer, saveTournament, loadTournaments, deleteTournament, pushLiveScore, removeLiveScore, loadTeams, saveTeam, deleteTeam, joinTeam } from './utils/db';
import { processMatchResult } from './utils/tournamentLogic';
import { socket } from './utils/socket';
import { NotificationsView } from './components/NotificationsView';
import { History, Trophy, ChevronLeft, ChevronRight, Search, Menu, X, Users, Activity, User, LogIn, LogOut, Camera, Upload, Info, Mail, Layers, Star, PlayCircle, Flag, Filter, Calendar, Zap, Loader2, Trash2, Edit3, Target, Moon, Sun, Bell } from 'lucide-react';

// --- CONFIGURATION ---
const LOGO_URL = "https://i.postimg.cc/fRdWdn9t/20251127-224320.png";

// --- Helper Components ---

const PlayerSelectModal = ({
    players,
    label,
    onSelect,
    variant = 'BATSMAN',
    disabledIds = [],
    ignoreStats = false
}: {
    players: Player[],
    label: string,
    onSelect: (id: string) => void,
    variant?: 'BATSMAN' | 'BOWLER',
    disabledIds?: string[],
    ignoreStats?: boolean
}) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleSelect = (id: string) => {
        setSelectedId(id);
    };

    const handleConfirm = () => {
        if (selectedId) {
            onSelect(selectedId);
        }
    };

    const handleCancel = () => {
        setSelectedId(null);
    };

    const selectedPlayer = players.find(p => p.id === selectedId);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-up border dark:border-slate-700">
                {!selectedId ? (
                    <>
                        <h3 className="text-xl font-bold mb-4 text-accent dark:text-blue-400">Select {label}</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {players.map(p => {
                                const isBatsmanOut = !ignoreStats && variant === 'BATSMAN' && p.isOut;
                                const isDisabledByProp = disabledIds.includes(p.id);
                                const isDisabled = isBatsmanOut || isDisabledByProp;

                                let statusText = '';
                                if (isBatsmanOut) statusText = '(Out)';
                                else if (isDisabledByProp && variant === 'BOWLER') statusText = '(Bowled Last Over)';

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelect(p.id)}
                                        disabled={isDisabled}
                                        className={`w-full p-3 text-left rounded-lg border flex items-center gap-3 transition-colors ${isDisabled ? 'bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white group'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isDisabled ? 'bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600' : 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-500 group-hover:bg-white dark:group-hover:bg-slate-600'}`}>
                                            {p.avatar ? (
                                                <img src={p.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{p.name}</div>
                                            {statusText && <div className="text-xs font-bold dark:text-gray-400">{statusText}</div>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center animate-fade-in">
                        <h3 className="text-xl font-bold mb-2 text-accent dark:text-blue-400">Confirm Selection</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">Select <span className="font-bold text-gray-900 dark:text-white">{selectedPlayer?.name}</span> as {label}?</p>

                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
                                {selectedPlayer?.avatar ? (
                                    <img src={selectedPlayer.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCancel}
                                className="py-3 px-4 rounded-lg font-bold border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                No, Change
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="py-3 px-4 rounded-lg font-bold bg-accent text-white hover:bg-accent/90 shadow-lg transition-transform active:scale-95"
                            >
                                Yes, Confirm
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

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

const SuperOverInterface = ({ onPlaySuperOver, onSkip }: { onPlaySuperOver: () => void, onSkip: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-scale-up">
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Zap className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Scores Tied!</h2>
            <p className="text-gray-600 mb-8 text-lg">Do you want to play a <span className="font-bold text-purple-600">Super Over</span> to decide the winner?</p>

            <div className="space-y-3">
                <button
                    onClick={onPlaySuperOver}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                    <Zap className="w-5 h-5 fill-current" /> Play Super Over
                </button>
                <button
                    onClick={onSkip}
                    className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    End as Draw
                </button>
            </div>
        </div>
    </div>
);

// ... (AboutView, ComingSoonView, ProfileView components are standard and can be collapsed for brevity in this output, but are included in full implementation)
const AboutView = () => (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-secondary/30 overflow-hidden animate-fade-in mt-8">
        <div className="bg-accent p-8 text-center text-white">
            <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 p-2 overflow-hidden border-2 border-white/20">
                <img
                    src={LOGO_URL}
                    alt="ARcricinfo Logo"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                />
                <Info className="w-10 h-10 hidden" />
            </div>
            <h2 className="text-3xl font-bold mb-2">About ARcricinfo</h2>
            <p className="text-blue-100">The ultimate cricket management platform for enthusiasts.</p>
        </div>

        <div className="p-8 space-y-8">
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-accent" /> Makers
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-lg font-semibold text-gray-900">Roshan Yadav</p>
                    <p className="text-gray-500 text-sm">Lead Developer & Creator</p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-accent" /> Business Enquiries
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-gray-600 mb-1">Email us at:</p>
                    <a href="mailto:roshantalks228@gmail.com" className="text-lg font-bold text-blue-600 break-all hover:underline">
                        roshantalks228@gmail.com
                    </a>
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
                <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg">
                    <Activity className="w-6 h-6 mx-auto text-accent mb-2" />
                    <div className="font-bold text-gray-800">Fast</div>
                </div>
                <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto text-accent mb-2" />
                    <div className="font-bold text-gray-800">Easy</div>
                </div>
                <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg">
                    <Trophy className="w-6 h-6 mx-auto text-accent mb-2" />
                    <div className="font-bold text-gray-800">Pro</div>
                </div>
            </div>
        </div>
    </div>
);

const ComingSoonView = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-md w-full">
            <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                <Icon className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4 uppercase tracking-wider">
                Coming Soon
            </h3>
            <p className="text-gray-500 mb-8">
                We are working hard to bring you this feature. Stay tuned for updates!
            </p>
            <div className="flex justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-200"></span>
            </div>
        </div>
    </div>
);

const ProfileView = ({ userProfile, dbPlayers, onViewStats, onSave, onLogout }: { userProfile: UserProfile | null, dbPlayers: DBPlayer[], onViewStats: (p: DBPlayer) => void, onSave: (p: UserProfile) => void, onLogout: () => void }) => {
    const [isEditing, setIsEditing] = useState(!userProfile);
    const [name, setName] = useState(userProfile?.name || '');
    const [email, setEmail] = useState(userProfile?.email || '');
    const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatar || '');

    useEffect(() => {
        if (userProfile && !isEditing) {
            setName(userProfile.name);
            setEmail(userProfile.email);
            setAvatarPreview(userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=random`);
        }
    }, [userProfile, isEditing]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!name.trim() || !email.trim()) return;
        const finalAvatar = avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
        onSave({ name, email, avatar: finalAvatar });
        if (userProfile) setIsEditing(false);
    };

    if (userProfile && !isEditing) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-secondary/30 p-8 animate-fade-in mt-10">
                <div className="text-center mb-8 relative">
                    <button onClick={() => setIsEditing(true)} className="absolute right-0 top-0 text-accent hover:text-blue-700 bg-blue-50 p-2 rounded-full transition-colors">
                        <Edit3 className="w-5 h-5" />
                    </button>
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-gray-100 overflow-hidden mb-4 shadow-sm">
                        <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
                    <p className="text-gray-500">{userProfile.email}</p>
                </div>

                {(() => {
                    const userStats = dbPlayers.find(p => p.name.toLowerCase() === userProfile.name.toLowerCase());
                    if (userStats) {
                        return (
                            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity className="w-5 h-5 text-accent"/> Career Stats</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                    <div className="bg-white p-2 rounded shadow-sm">
                                        <div className="text-xl font-black text-gray-900">{userStats.matches_played}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Matches</div>
                                    </div>
                                    <div className="bg-white p-2 rounded shadow-sm">
                                        <div className="text-xl font-black text-gray-900">{userStats.total_runs}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Runs</div>
                                    </div>
                                    <div className="bg-white p-2 rounded shadow-sm">
                                        <div className="text-xl font-black text-gray-900">{userStats.total_wickets}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Wickets</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onViewStats(userStats)}
                                    className="w-full py-2 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    View Full Analysis
                                </button>
                            </div>
                        );
                    }
                    return (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-500 text-center italic">Play some matches with this exact profile name to see your stats here!</p>
                        </div>
                    );
                })()}

                <button
                    onClick={onLogout}
                    className="w-full py-3 border-2 border-red-100 text-red-600 font-bold rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-secondary/30 p-8 animate-fade-in mt-10">
            <div className="text-center mb-8 relative">
                {userProfile && (
                    <button onClick={() => setIsEditing(false)} className="absolute left-0 top-0 text-gray-400 hover:text-gray-700 p-2 transition-colors">
                        X
                    </button>
                )}
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                    <User className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{userProfile ? 'Edit Profile' : 'Create Profile'}</h2>
                <p className="text-gray-500">{userProfile ? 'Update your personal details below.' : 'Save your stats and customize your player.'}</p>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <Camera className="w-8 h-8 text-gray-400" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Upload className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">Tap to upload photo (optional)</span>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none font-medium bg-white text-gray-900"
                        placeholder="e.g. Roshan Yadav"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none font-medium bg-white text-gray-900"
                        placeholder="e.g. roshan@example.com"
                    />
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-4 bg-accent text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all mt-4 flex items-center justify-center gap-2"
                >
                    Create Profile <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
            </div>
        </div>
    );
};

const Navbar = ({ activeView, onViewChange, isMatchActive, userProfile, isDarkMode, toggleDarkMode }: { activeView: string, onViewChange: (v: string) => void, isMatchActive: boolean, userProfile: UserProfile | null, isDarkMode: boolean, toggleDarkMode: () => void }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { id: 'HOME', label: 'Home', icon: Trophy },
        { id: 'HISTORY', label: 'History', icon: History },
        { id: 'PLAYERS', label: 'Players', icon: Users },
        { id: 'TEAMS', label: 'Teams', icon: Users },
        { id: 'TOURNAMENT_HOME', label: 'Tournaments', icon: Flag },
        { id: 'COMMUNITY', label: 'Community', icon: Target },
        { id: 'ABOUT', label: 'About', icon: Info },
    ];

    const handleNav = (view: string) => {
        onViewChange(view);
        setIsMenuOpen(false);
    }

    return (
        <nav className="bg-accent text-white sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-4">
                    <div
                        onClick={() => handleNav('HOME')}
                        className="flex shrink-0 items-center gap-2 cursor-pointer group mr-2 md:mr-4"
                    >
                        <img
                            src={LOGO_URL}
                            alt="ARcricinfo"
                            className="h-10 w-10 object-cover rounded-full border-2 border-white/80 shadow-sm group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden bg-yellow-500 p-1.5 rounded-lg">
                            <Trophy className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden sm:block">ARcricinfo</span>
                    </div>

                    <div className="hidden lg:flex flex-1 justify-center items-center gap-4 xl:gap-6">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeView === item.id ? 'text-yellow-400' : 'text-gray-300 hover:text-white'}`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:gap-4">
                        {isMatchActive && activeView !== 'LIVE' && activeView !== 'TOSS' && activeView !== 'SETUP' && (
                            <button
                                onClick={() => handleNav('LIVE')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full animate-pulse text-xs font-bold"
                            >
                                <Activity className="w-3 h-3" /> <span className="hidden md:inline">LIVE</span>
                            </button>
                        )}

                        <button 
                            onClick={toggleDarkMode} 
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center border border-transparent hover:border-white/20"
                            title="Toggle Dark Mode"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-300" />}
                        </button>

                        {userProfile && (
                            <button
                                onClick={() => handleNav('NOTIFICATIONS')}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors relative mr-2"
                                title="Inbox Updates"
                            >
                                <Bell className={`w-5 h-5 ${activeView === 'NOTIFICATIONS' ? 'text-yellow-400' : 'text-white'}`} />
                                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                        )}
                        <button
                            onClick={() => handleNav('PROFILE')}
                            className="flex items-center gap-2 hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                        >
                            {userProfile?.avatar ? (
                                <img src={userProfile.avatar} alt="Profile" className="w-8 h-8 rounded-full border-2 border-yellow-500 object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                                    <User className="w-4 h-4 text-gray-300" />
                                </div>
                            )}
                        </button>

                        <button
                            className="md:hidden p-2"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-gray-900 border-t border-gray-800 animate-fade-in">
                    <div className="p-4 space-y-2">
                        {isMatchActive && activeView !== 'LIVE' && (
                            <button
                                onClick={() => handleNav('LIVE')}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 text-red-400 rounded-lg font-bold"
                            >
                                <Activity className="w-5 h-5" /> Back to Live Match
                            </button>
                        )}
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${activeView === item.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    )
}

const AppInner = () => {
    const { toast, confirm: showConfirm } = useToast();
    
    // ─── Dark Mode State ──────────────────────────────────────────────────────
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    const [liveViewMatchId, setLiveViewMatchId] = useState<string | null>(null);
    const [publicPlayerId, setPublicPlayerId] = useState<string | null>(null);
    const [isBroadcastMode, setIsBroadcastMode] = useState<boolean>(false);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const liveId = params.get('live');
        const broadcast = params.get('broadcast') === 'true';
        if (liveId) {
            setLiveViewMatchId(liveId);
            setIsBroadcastMode(broadcast);
        }

        const playerId = params.get('player');
        if (playerId) {
            setPublicPlayerId(playerId);
        }
        
        // Handle Team Join invite links
        const joinTeamId = params.get('joinTeam');
        if (joinTeamId) {
            // We store the pending join request in localStorage
            localStorage.setItem('pending_join_team', joinTeamId);
        }
    }, []);

    // If viewing a live match, render the public LiveScoreView immediately
    if (liveViewMatchId) {
        if (isBroadcastMode) {
            return <BroadcastOverlay matchId={liveViewMatchId} />;
        }
        return <LiveScoreView matchId={liveViewMatchId} onClose={() => {
            window.history.replaceState(null, '', window.location.pathname);
            setLiveViewMatchId(null);
        }} />;
    }

    if (publicPlayerId) {
        return <PublicProfileView playerId={publicPlayerId} />;
    }

    // ─── Auth State ───────────────────────────────────────────────────────────
    const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // ─── App Data State ───────────────────────────────────────────────────────
    const [match, setMatch] = useState<Match | null>(null);
    const [history, setHistory] = useState<Match[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [series, setSeries] = useState<Series | null>(null);
    const [completedSeries, setCompletedSeries] = useState<Series[]>([]);
    const [selectedCompletedSeries, setSelectedCompletedSeries] = useState<Series | null>(null);

    const [dbPlayers, setDbPlayers] = useState<DBPlayer[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<DBPlayer | null>(null);
    const [isPlayersLoading, setIsPlayersLoading] = useState(false);

    // Tournament state
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
    const [activeTournamentFixture, setActiveTournamentFixture] = useState<TournamentFixture | null>(null);

    // Persistent Teams state
    const [persistentTeams, setPersistentTeams] = useState<PersistentTeam[]>([]);

    const [view, setView] = useState('HOME');
    const [animEvent, setAnimEvent] = useState<AnimationEvent>({ type: 'NONE', message: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SINGLE' | 'SERIES' | 'TOURNAMENTS'>('ALL');
    const [undoStack, setUndoStack] = useState<Match[]>([]);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Timeline Edit state
    const [editingHistoricalBall, setEditingHistoricalBall] = useState<Ball | null>(null);
    const [historicalEditRuns, setHistoricalEditRuns] = useState<number>(0);
    const [historicalEditExtraRuns, setHistoricalEditExtraRuns] = useState<number>(0);
    const [historicalEditExtraType, setHistoricalEditExtraType] = useState<ExtraType>(ExtraType.NONE);

    // ─── Retroactive Edit Logic ────────────────────────────────────────────────
    const handleSaveHistoricalEdit = () => {
        if (!editingHistoricalBall || !match) return;
        
        setMatch(prev => {
            if (!prev) return prev;
            const newMatch = JSON.parse(JSON.stringify(prev)) as Match;
            const bIdx = newMatch.balls.findIndex(b => b.id === editingHistoricalBall.id);
            if (bIdx === -1) return prev;
            
            const oldBall = newMatch.balls[bIdx];
            
            const runsDiff = historicalEditRuns - oldBall.runsScored;
            const extraDiff = historicalEditExtraRuns - (oldBall.extraRuns || 0);
            const totalDiff = runsDiff + extraDiff;

            // 1. Update Ball Record
            newMatch.balls[bIdx].runsScored = historicalEditRuns;
            newMatch.balls[bIdx].extraRuns = historicalEditExtraRuns;
            newMatch.balls[bIdx].extraType = historicalEditExtraType;

            // 2. Determine Which team is batting for this specific ball
            // Using strikerId to trace back to team
            const isTeamABatting = newMatch.teamA.players.some(p => p.id === oldBall.strikerId);
            const battingTeam = isTeamABatting ? newMatch.teamA : newMatch.teamB;
            const bowlingTeam = isTeamABatting ? newMatch.teamB : newMatch.teamA;

            if (oldBall.isSuperOver) {
                battingTeam.superOverRuns += totalDiff;
            } else {
                battingTeam.totalRuns += totalDiff;
            }

            // 3. Update Striker Stats
            const striker = battingTeam.players.find(p => p.id === oldBall.strikerId);
            if (striker) {
                if (oldBall.isSuperOver && striker.superOverStats) {
                    striker.superOverStats.runs += runsDiff;
                } else {
                    striker.runs += runsDiff;
                }
                
                // Adjust Fours & Sixes tracking
                if (oldBall.runsScored === 4) striker.fours = Math.max(0, striker.fours - 1);
                if (oldBall.runsScored === 6) striker.sixes = Math.max(0, striker.sixes - 1);
                if (historicalEditRuns === 4) striker.fours += 1;
                if (historicalEditRuns === 6) striker.sixes += 1;
            }

            // 4. Update Bowler Stats (Wides/NoBalls hurt economy)
            const bowler = bowlingTeam.players.find(p => p.id === oldBall.bowlerId);
            if (bowler) {
                let oldBowlerRuns = oldBall.runsScored;
                if (oldBall.extraType === ExtraType.WIDE || oldBall.extraType === ExtraType.NO_BALL) oldBowlerRuns += (oldBall.extraRuns || 0);

                let newBowlerRuns = historicalEditRuns;
                if (historicalEditExtraType === ExtraType.WIDE || historicalEditExtraType === ExtraType.NO_BALL) newBowlerRuns += historicalEditExtraRuns;

                const bowlerDiff = newBowlerRuns - oldBowlerRuns;
                if (oldBall.isSuperOver && bowler.superOverStats) {
                    bowler.superOverStats.runsConceded = Math.max(0, bowler.superOverStats.runsConceded + bowlerDiff);
                } else {
                    bowler.runsConceded = Math.max(0, bowler.runsConceded + bowlerDiff);
                }
            }

            return newMatch;
        });

        setEditingHistoricalBall(null);
    };

    // Helper: require auth before an action
    const requireAuth = (action: () => void) => {
        if (!authUser) {
            setShowAuthModal(true);
            return;
        }
        action();
    };

    // ─── Load data from Supabase after login ──────────────────────────────────
    const loadUserData = useCallback(async (user: any) => {
        setIsPlayersLoading(true);
        try {
            const userId = user.id;
            const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player';
            const fallbackEmail = user.email || '';

            const [profile, matches, activeSeries, endedSeries, players, allTournaments, userTeams] = await Promise.all([
                loadProfile(userId),
                loadMatches(userId),
                loadActiveSeries(userId),
                loadCompletedSeries(userId),
                loadAllPlayers(userId),
                loadTournaments(userId),
                loadTeams(userId)
            ]);
            
            if (profile) {
                setUserProfile({ name: profile.name, email: profile.email, avatar: profile.avatar });
            } else {
                const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;
                setUserProfile({ name: fallbackName, email: fallbackEmail, avatar: fallbackAvatar });
                saveProfile(userId, { name: fallbackName, email: fallbackEmail, avatar: fallbackAvatar });
            }
            if (matches.length) setHistory(matches);
            if (activeSeries) setSeries(activeSeries);
            if (endedSeries.length) setCompletedSeries(endedSeries);
            if (players.length) setDbPlayers(players);
            if (allTournaments.length) {
                setTournaments(allTournaments);
                const active = allTournaments.find(t => t.status === 'ACTIVE');
                if (active) setActiveTournament(active);
            }
            if (userTeams.length) setPersistentTeams(userTeams);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsPlayersLoading(false);
        }
    }, []);

    // ─── Auth listener (runs once on mount) ───────────────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setAuthUser({ id: session.user.id, email: session.user.email ?? '' });
                loadUserData(session.user);
            }
            setIsAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setAuthUser({ id: session.user.id, email: session.user.email ?? '' });
                loadUserData(session.user);
            } else {
                setAuthUser(null);
            }
        });
        return () => subscription.unsubscribe();
    }, [loadUserData]);

    // ─── Process Pending Join Team ───────────────────────────────────────────
    useEffect(() => {
        const pendingTeamId = localStorage.getItem('pending_join_team');
        if (pendingTeamId) {
            if (!isAuthLoading && !authUser) {
                // Not authenticated yet, show login modal
                setShowAuthModal(true);
            } else if (authUser && userProfile) {
                // Authenticated, prompt to join
                const confirmJoin = window.confirm(`You have been invited to join a team. Do you want to accept?`);
                if (confirmJoin) {
                    joinTeam(pendingTeamId, {
                        id: authUser.id,
                        name: userProfile.name,
                        avatar: userProfile.avatar,
                        mobileNo: userProfile.mobileNo
                    }).then(() => {
                        toast(`Successfully joined the team!`, 'success');
                        setView('TEAMS');
                        loadUserData(authUser); // reload teams
                    });
                }
                localStorage.removeItem('pending_join_team');
                // Remove param from URL without reloading
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({path: newUrl}, '', newUrl);
            }
        }
    }, [authUser, userProfile, isAuthLoading, loadUserData, toast]);

    // ─── localStorage mirrors (offline cache) ────────────────────────────────
    useEffect(() => { localStorage.setItem('match_history', JSON.stringify(history)); }, [history]);
    useEffect(() => {
        if (userProfile) localStorage.setItem('user_profile', JSON.stringify(userProfile));
        else localStorage.removeItem('user_profile');
    }, [userProfile]);
    useEffect(() => {
        if (series) localStorage.setItem('active_series', JSON.stringify(series));
        else localStorage.removeItem('active_series');
    }, [series]);
    useEffect(() => { localStorage.setItem('completed_series_history', JSON.stringify(completedSeries)); }, [completedSeries]);

    // ─── Logout ───────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setAuthUser(null);
        setMatch(null);
        setHistory([]);
        setUserProfile(null);
        setSeries(null);
        setCompletedSeries([]);
        setDbPlayers([]);
        setSelectedPlayer(null);
        setTournaments([]);
        setActiveTournament(null);
        setActiveTournamentFixture(null);
        setView('HOME');
        localStorage.clear();
    };

    const saveToHistory = (completedMatch: Match) => {
        const updatedHistory = [completedMatch, ...history.filter(m => m.id !== completedMatch.id)];
        setHistory(updatedHistory);
        // Persist match + sync player stats
        if (authUser) {
            saveMatch(authUser.id, completedMatch);
            syncPlayersFromMatches(authUser.id, updatedHistory).then(() =>
                loadAllPlayers(authUser.id).then(players => setDbPlayers(players))
            );
        }

        // Handle series update
        if (series && completedMatch.seriesId === series.id) {
            const updatedSeries = { ...series };
            updatedSeries.matches.push(completedMatch);
            if (completedMatch.winningTeamId) {
                if (completedMatch.winningTeamId === completedMatch.teamA.id) updatedSeries.teamAWins += 1;
                else updatedSeries.teamBWins += 1;
            } else {
                updatedSeries.draws += 1;
            }
            setSeries(updatedSeries);
            if (authUser) saveSeries(authUser.id, updatedSeries);
        }

        // Handle tournament fixture result
        if (activeTournament && activeTournamentFixture && completedMatch.tournamentId === activeTournament.id) {
            const updatedTournament = processMatchResult(activeTournament, completedMatch);
            setActiveTournament(updatedTournament);
            setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
            if (authUser) saveTournament(authUser.id, updatedTournament);
            setActiveTournamentFixture(null);
        }
    };

    // ─── Tournament Handlers ───────────────────────────────────────────────
    const handleTournamentCreate = (tournament: Tournament) => {
        setTournaments(prev => [tournament, ...prev]);
        setActiveTournament(tournament);
        if (authUser) saveTournament(authUser.id, tournament);
        setView('TOURNAMENT_VIEW');
    };

    const handleTournamentMatchStart = (fixture: TournamentFixture) => {
        if (!activeTournament) return;
        // Mark fixture as LIVE
        const updatedFixtures = activeTournament.fixtures.map(f =>
            f.id === fixture.id ? { ...f, status: 'LIVE' as const } : f
        );
        const updatedTournament = { ...activeTournament, fixtures: updatedFixtures };
        setActiveTournament(updatedTournament);
        setActiveTournamentFixture(fixture);
        if (authUser) saveTournament(authUser.id, updatedTournament);
        // Navigate to match setup with pre-filled teams (MatchSetup will detect fixture teams)
        setView('SETUP_TOURNAMENT_MATCH');
    };

    const handleViewChange = (newView: string) => {
        if (newView === 'HOME' && match && match.status === MatchStatus.COMPLETED) {
            setMatch(null);
        }
        setView(newView);
    };

    const handleMatchCreate = (teamA: Team, teamB: Team, totalOvers: number, youtubeUrl?: string) => {
        const newMatch: Match = {
            id: crypto.randomUUID(),
            date: Date.now(),
            status: MatchStatus.TOSS,
            totalOvers,
            teamA,
            teamB,
            currentInnings: 1,
            balls: [],
            seriesId: series ? series.id : undefined,
            youtubeUrl
        };

        if (series && series.status === 'ACTIVE') {
            const updatedSeries = { ...series };
            updatedSeries.teamASquad = teamA.players.map(p => p.name);
            updatedSeries.teamBSquad = teamB.players.map(p => p.name);
            setSeries(updatedSeries);
        }

        setMatch(newMatch);
        setUndoStack([]);
        setView('TOSS');
    };

    const handleTossComplete = (winnerId: string, batFirst: boolean) => {
        if (!match) return;
        const battingTeamId = batFirst ? winnerId : (winnerId === match.teamA.id ? match.teamB.id : match.teamA.id);

        const updatedMatch = {
            ...match,
            tossWinnerId: winnerId,
            battingFirstId: battingTeamId,
            teamA: { ...match.teamA, isBatting: match.teamA.id === battingTeamId },
            teamB: { ...match.teamB, isBatting: match.teamB.id === battingTeamId },
            status: MatchStatus.LIVE
        };
        setMatch(updatedMatch);
        setView('LIVE');
    }

    const handleScheduleMatch = (teamA: Team, teamB: Team, totalOvers: number, dateMs: number, youtubeUrl?: string) => {
        const newMatch: Match = {
            id: crypto.randomUUID(),
            date: dateMs,
            status: MatchStatus.SCHEDULED,
            totalOvers,
            teamA,
            teamB,
            currentInnings: 1,
            balls: [],
            seriesId: series ? series.id : undefined,
            youtubeUrl,
            scheduledDate: dateMs
        };

        if (series && series.status === 'ACTIVE') {
            const updatedSeries = { ...series };
            updatedSeries.teamASquad = teamA.players.map(p => p.name);
            updatedSeries.teamBSquad = teamB.players.map(p => p.name);
            setSeries(updatedSeries);
        }

        setHistory(prev => [newMatch, ...prev]);
        if (authUser) saveMatch(authUser.id, newMatch);

        toast('Match Scheduled successfully!', 'success');
        setView('HISTORY');
    };

    // --- Series Logic ---
    const handleStartSeries = () => {
        setSeries(null);
        setView('SERIES_SETUP');
    }

    const handleSeriesMatchCreate = (teamA: Team, teamB: Team, overs: number, youtubeUrl?: string) => {
        if (!series) {
            const newSeries: Series = {
                id: crypto.randomUUID(),
                date: Date.now(),
                name: `${teamA.name} vs ${teamB.name} Series`,
                teamAName: teamA.name,
                teamBName: teamB.name,
                teamASquad: teamA.players.map(p => p.name),
                teamBSquad: teamB.players.map(p => p.name),
                teamAWins: 0,
                teamBWins: 0,
                draws: 0,
                matches: [],
                status: 'ACTIVE'
            };
            setSeries(newSeries);
            if (authUser) saveSeries(authUser.id, newSeries);

            const newMatch: Match = {
                id: crypto.randomUUID(),
                date: Date.now(),
                status: MatchStatus.TOSS,
                totalOvers: overs,
                teamA,
                teamB,
                currentInnings: 1,
                balls: [],
                seriesId: newSeries.id,
                youtubeUrl
            };
            setMatch(newMatch);
            setUndoStack([]);
            setView('TOSS');

        } else {
            handleMatchCreate(teamA, teamB, overs, youtubeUrl);
        }
    }

    const handleEndSeries = () => {
        if (!series) return;

        let winner = 'Draw';
        if (series.teamAWins > series.teamBWins) winner = series.teamAName;
        else if (series.teamBWins > series.teamAWins) winner = series.teamBName;

        const allPlayerPerformances: { [name: string]: { runs: number, wickets: number, name: string, team: string, avatar?: string } } = {};

        series.matches.forEach(m => {
            [...m.teamA.players, ...m.teamB.players].forEach(p => {
                if (!allPlayerPerformances[p.name]) {
                    allPlayerPerformances[p.name] = { runs: 0, wickets: 0, name: p.name, team: p.teamId === m.teamA.id ? m.teamA.name : m.teamB.name, avatar: p.avatar };
                }
                allPlayerPerformances[p.name].runs += p.runs;
                allPlayerPerformances[p.name].wickets += p.wickets;
                if (p.avatar && !allPlayerPerformances[p.name].avatar) allPlayerPerformances[p.name].avatar = p.avatar;
            });
        });

        let bestPlayer = null;
        let maxPoints = -1;

        Object.values(allPlayerPerformances).forEach(p => {
            const points = (p.runs * 1) + (p.wickets * 20);
            if (points > maxPoints) {
                maxPoints = points;
                bestPlayer = p;
            }
        });

        let seriesMOTM: Player | undefined = undefined;
        if (bestPlayer) {
            seriesMOTM = {
                id: 'mos',
                name: (bestPlayer as any).name,
                teamId: 'mos_team',
                isCaptain: false,
                runs: (bestPlayer as any).runs,
                wickets: (bestPlayer as any).wickets,
                avatar: (bestPlayer as any).avatar,
                ballsFaced: 0, fours: 0, sixes: 0, isOut: false, dismissalType: DismissalType.NONE,
                oversBowled: 0, runsConceded: 0, maidens: 0,
                catches: 0, runOuts: 0, stumpings: 0,
            };
        }

        const completedSeriesObj: Series = {
            ...series,
            status: 'COMPLETED' as const,
            winner,
            manOfSeries: seriesMOTM
        };

        setCompletedSeries([completedSeriesObj, ...completedSeries]);
        setSeries(null);
        if (authUser) saveSeries(authUser.id, completedSeriesObj);
        setSelectedCompletedSeries(completedSeriesObj);
        setView('SERIES_SUMMARY');
    }

    // --- Super Over Logic ---
    const handlePlaySuperOver = () => {
        if (!match) return;

        // Setup Super Over (Innings 3)
        // Team A bats first in super over for simplicity logic
        const superOverMatch: Match = {
            ...match,
            status: MatchStatus.LIVE,
            currentInnings: 3,
            currentStrikerId: undefined,
            currentNonStrikerId: undefined,
            currentBowlerId: undefined,
            teamA: { ...match.teamA, isBatting: true, superOverBalls: 0, superOverRuns: 0, superOverWickets: 0 },
            teamB: { ...match.teamB, isBatting: false, superOverBalls: 0, superOverRuns: 0, superOverWickets: 0 },
        };

        setMatch(superOverMatch);
        setAnimEvent({ type: 'NONE', message: 'SUPER OVER START!' });
    };

    const handleSkipSuperOver = () => {
        if (!match) return;
        const endedMatch = { ...match, status: MatchStatus.COMPLETED, winningTeamId: undefined }; // Explicit Draw
        setMatch(endedMatch);
        saveToHistory(endedMatch);
    };

    const saveStateForUndo = () => {
        if (match) {
            setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(match))]);
        }
    };

    const handleUndo = () => {
        if (undoStack.length > 0) {
            const previousState = undoStack[undoStack.length - 1];
            setMatch(previousState);
            setUndoStack(prev => prev.slice(0, -1));
        }
    };

    const handleAnimComplete = () => {
        if (animEvent.type === 'WIN') {
            if (match && match.manOfTheMatchId) {
                const allPlayers = [...match.teamA.players, ...match.teamB.players];
                const motmPlayer = allPlayers.find(p => p.id === match.manOfTheMatchId);
                if (motmPlayer) {
                    setAnimEvent({
                        type: 'MOTM',
                        message: motmPlayer.name,
                        player: motmPlayer
                    });
                    return;
                }
            }
        }
        setAnimEvent({ type: 'NONE', message: '' });
    };

    // --- Main Engine ---
    const updateMatchState = (
        runs: number,
        extraType: ExtraType,
        dismissalType: DismissalType,
        fielderId?: string
    ) => {
        if (!match) return;
        saveStateForUndo();

        const newMatch = { ...match };

        // Determine context based on currentInnings (1/2 or 3/4)
        const isSuperOver = newMatch.currentInnings > 2;

        let battingTeam, bowlingTeam;

        // Helper to get teams based on innings
        if (newMatch.currentInnings === 1) {
            battingTeam = newMatch.battingFirstId === newMatch.teamA.id ? newMatch.teamA : newMatch.teamB;
            bowlingTeam = newMatch.battingFirstId === newMatch.teamA.id ? newMatch.teamB : newMatch.teamA;
        } else if (newMatch.currentInnings === 2) {
            battingTeam = newMatch.battingFirstId === newMatch.teamA.id ? newMatch.teamB : newMatch.teamA;
            bowlingTeam = newMatch.battingFirstId === newMatch.teamA.id ? newMatch.teamA : newMatch.teamB;
        } else if (newMatch.currentInnings === 3) {
            battingTeam = newMatch.teamA;
            bowlingTeam = newMatch.teamB;
        } else { // 4
            battingTeam = newMatch.teamB;
            bowlingTeam = newMatch.teamA;
        }

        const striker = battingTeam.players.find(p => p.id === newMatch.currentStrikerId);
        const bowler = bowlingTeam.players.find(p => p.id === newMatch.currentBowlerId);

        if (!striker || !bowler) return;

        // --- Init Super Over Stats if needed ---
        if (isSuperOver) {
            if (!striker.superOverStats) {
                striker.superOverStats = { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, dismissalType: DismissalType.NONE, oversBowled: 0, runsConceded: 0, wickets: 0, maidens: 0 };
            }
            if (!bowler.superOverStats) {
                bowler.superOverStats = { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, dismissalType: DismissalType.NONE, oversBowled: 0, runsConceded: 0, wickets: 0, maidens: 0 };
            }
        }

        let totalRunsToAdd = runs;
        let batsmanRuns = runs;
        let extrasToAdd = 0;

        let isLegalDelivery = true;

        if (extraType === ExtraType.WIDE) {
            isLegalDelivery = false;
            extrasToAdd = 1 + runs;
            totalRunsToAdd = extrasToAdd;
            batsmanRuns = 0;
        } else if (extraType === ExtraType.NO_BALL) {
            isLegalDelivery = false;
            extrasToAdd = 1;
            totalRunsToAdd = 1 + runs;
            batsmanRuns = runs;
        } else if (extraType === ExtraType.BYE || extraType === ExtraType.LEG_BYE) {
            isLegalDelivery = true;
            extrasToAdd = runs;
            totalRunsToAdd = runs;
            batsmanRuns = 0;
        }

        // Update Runs (Team)
        if (isSuperOver) {
            battingTeam.superOverRuns += totalRunsToAdd;
        } else {
            battingTeam.totalRuns += totalRunsToAdd;
            battingTeam.extras += extrasToAdd;
        }

        // Update Balls/Overs (Team)
        if (isLegalDelivery) {
            if (isSuperOver) battingTeam.superOverBalls += 1;
            else battingTeam.overs += 1;
        }

        // Update Player Stats (Batsman)
        if (isLegalDelivery || extraType === ExtraType.NO_BALL) {
            if (isSuperOver) striker.superOverStats!.ballsFaced += 1;
            else striker.ballsFaced += 1;
        }

        if (isSuperOver) {
            striker.superOverStats!.runs += batsmanRuns;
            if (batsmanRuns === 4) striker.superOverStats!.fours += 1;
            if (batsmanRuns === 6) striker.superOverStats!.sixes += 1;
        } else {
            striker.runs += batsmanRuns;
            if (batsmanRuns === 4) striker.fours += 1;
            if (batsmanRuns === 6) striker.sixes += 1;

            // Check Milestones
            if (striker.runs === 50) {
                socket.emit('match_milestone', { matchId: newMatch.id, title: 'Half Century', message: `${striker.name} reached 50!`, type: 'success' });
            } else if (striker.runs === 100) {
                socket.emit('match_milestone', { matchId: newMatch.id, title: 'Century!', message: `${striker.name} reached 100!`, type: 'accent' });
            }
        }

        // Update Player Stats (Bowler)
        if (isLegalDelivery) {
            if (isSuperOver) bowler.superOverStats!.oversBowled += 1;
            else bowler.oversBowled += 1;
        }

        if (isSuperOver) bowler.superOverStats!.runsConceded += totalRunsToAdd;
        else bowler.runsConceded += totalRunsToAdd;

        // Handle Wicket
        let isWicket = false;
        let dismissedPlayerId = undefined;
        if (dismissalType !== DismissalType.NONE) {
            isWicket = true;

            if (isSuperOver) {
                striker.superOverStats!.isOut = true;
                striker.superOverStats!.dismissalType = dismissalType;
                battingTeam.superOverWickets += 1;
            } else {
                striker.isOut = true;
                striker.dismissalType = dismissalType;
                battingTeam.wickets += 1;
            }

            dismissedPlayerId = striker.id;

            if (dismissalType !== DismissalType.RUN_OUT && dismissalType !== DismissalType.HIT_WICKET && dismissalType !== DismissalType.OBSTRUCTING_FIELD) {
                if (isSuperOver) bowler.superOverStats!.wickets += 1;
                else bowler.wickets += 1;
            }

            newMatch.currentStrikerId = undefined;
            setAnimEvent({ type: 'WICKET', message: `${striker.name} OUT!` });

            // Emit Milestone
            if (newMatch.id) {
                socket.emit('match_milestone', {
                    matchId: newMatch.id,
                    title: 'Wicket!',
                    message: `${striker.name} is out (${dismissalType.replace('_', ' ')})`,
                    type: 'error'
                });
            }

            // Update fielder stats (catches / stumpings)
            if (fielderId && (dismissalType === DismissalType.CAUGHT || dismissalType === DismissalType.STUMPED)) {
                const fielder = bowlingTeam.players.find(p => p.id === fielderId);
                if (fielder) {
                    if (dismissalType === DismissalType.CAUGHT) fielder.catches += 1;
                    if (dismissalType === DismissalType.STUMPED) fielder.stumpings += 1;
                }
            }
        }

        // Log Ball
        const currentOverNumber = isSuperOver
            ? 0 // Super over is always "Over 1" conceptually, indexed 0
            : (isLegalDelivery ? Math.floor((battingTeam.overs - 1) / 6) : Math.floor(battingTeam.overs / 6));

        const newBall: Ball = {
            id: crypto.randomUUID(),
            overNumber: currentOverNumber < 0 ? 0 : currentOverNumber,
            ballNumber: isSuperOver ? battingTeam.superOverBalls : (battingTeam.overs % 6 || 6),
            bowlerId: bowler.id,
            strikerId: striker.id,
            nonStrikerId: newMatch.currentNonStrikerId!,
            runsScored: batsmanRuns,
            extraType,
            extraRuns: extrasToAdd > 0 ? (extraType === ExtraType.WIDE || extraType === ExtraType.NO_BALL ? runs : extrasToAdd) : 0,
            isWicket,
            dismissalType,
            dismissedPlayerId,
            fielderId,
            timestamp: Date.now(),
            isSuperOver
        };
        newMatch.balls.push(newBall);

        if (batsmanRuns === 4) setAnimEvent({ type: 'FOUR', message: 'BOUNDARY!' });
        if (batsmanRuns === 6) setAnimEvent({ type: 'SIX', message: 'MAXIMUM!' });

        // --- Win/Tie/Innings Change Logic ---

        // 2nd Innings Target Check
        if (newMatch.currentInnings === 2) {
            const target = bowlingTeam.totalRuns + 1;
            if (battingTeam.totalRuns >= target) {
                newMatch.status = MatchStatus.COMPLETED;
                newMatch.winningTeamId = battingTeam.id;
                newMatch.manOfTheMatchId = determineManOfTheMatch(newMatch);
                setAnimEvent({ type: 'WIN', message: `${battingTeam.name} WINS!` });
                saveToHistory(newMatch);
            }
        }
        // Super Over 2 (Innings 4) Target Check
        else if (newMatch.currentInnings === 4) {
            const target = bowlingTeam.superOverRuns + 1;
            if (battingTeam.superOverRuns >= target) {
                newMatch.status = MatchStatus.COMPLETED;
                newMatch.winningTeamId = battingTeam.id;
                newMatch.manOfTheMatchId = determineManOfTheMatch(newMatch);
                setAnimEvent({ type: 'WIN', message: `${battingTeam.name} WINS SUPER OVER!` });
                saveToHistory(newMatch);
            }
        }

        // Check End of Innings (Wickets or Overs)
        const oversLimit = isSuperOver ? 1 : newMatch.totalOvers;
        const wicketsLimit = isSuperOver ? 2 : 10; // Usually 2 wickets in super over, keeping standard rules

        const currentBalls = isSuperOver ? battingTeam.superOverBalls : battingTeam.overs;
        const currentWickets = isSuperOver ? battingTeam.superOverWickets : battingTeam.wickets;

        if (newMatch.status !== MatchStatus.COMPLETED && (currentWickets >= wicketsLimit || currentBalls >= oversLimit * 6)) {

            // End Innings 1 -> Start Innings 2
            if (newMatch.currentInnings === 1) {
                newMatch.currentInnings = 2;
                // Switch Batting Flags
                newMatch.teamA.isBatting = !newMatch.teamA.isBatting;
                newMatch.teamB.isBatting = !newMatch.teamB.isBatting;

                // Reset Players
                newMatch.currentStrikerId = undefined;
                newMatch.currentNonStrikerId = undefined;
                newMatch.currentBowlerId = undefined;

                const target = battingTeam.totalRuns + 1;
                setAnimEvent({ type: 'INNINGS_BREAK', message: `Target: ${target}` });
            }
            // End Innings 2 -> Check Result
            else if (newMatch.currentInnings === 2) {
                if (battingTeam.totalRuns < bowlingTeam.totalRuns) {
                    newMatch.status = MatchStatus.COMPLETED;
                    newMatch.winningTeamId = bowlingTeam.id;
                    newMatch.manOfTheMatchId = determineManOfTheMatch(newMatch);
                    setAnimEvent({ type: 'WIN', message: `${bowlingTeam.name} WINS!` });
                    saveToHistory(newMatch);
                } else {
                    // TIE DETECTED
                    newMatch.status = MatchStatus.TIED;
                    setAnimEvent({ type: 'NONE', message: 'SCORES TIED!' });
                    // Do not save history yet, wait for user choice
                }
            }
            // End Innings 3 (SO 1) -> Start Innings 4 (SO 2)
            else if (newMatch.currentInnings === 3) {
                newMatch.currentInnings = 4;
                // Switch Batting Flags for SO
                newMatch.teamA.isBatting = false;
                newMatch.teamB.isBatting = true;

                newMatch.currentStrikerId = undefined;
                newMatch.currentNonStrikerId = undefined;
                newMatch.currentBowlerId = undefined;

                const target = battingTeam.superOverRuns + 1;
                setAnimEvent({ type: 'INNINGS_BREAK', message: `SO Target: ${target}` });
            }
            // End Innings 4 (SO 2) -> Check SO Result
            else if (newMatch.currentInnings === 4) {
                if (battingTeam.superOverRuns < bowlingTeam.superOverRuns) {
                    newMatch.status = MatchStatus.COMPLETED;
                    newMatch.winningTeamId = bowlingTeam.id;
                    // Man of match might need adjustment for super over, but standard calc works
                    newMatch.manOfTheMatchId = determineManOfTheMatch(newMatch);
                    setAnimEvent({ type: 'WIN', message: `${bowlingTeam.name} WINS SUPER OVER!` });
                } else {
                    // Super Over Tied - For simplicity, just End as Draw or boundary count (not impl)
                    newMatch.status = MatchStatus.COMPLETED;
                    setAnimEvent({ type: 'NONE', message: 'SUPER OVER TIED!' });
                }
                saveToHistory(newMatch);
            }
        }

        // Strike Rotation
        if (batsmanRuns % 2 !== 0 && !isWicket) {
            const temp = newMatch.currentStrikerId;
            newMatch.currentStrikerId = newMatch.currentNonStrikerId;
            newMatch.currentNonStrikerId = temp;
        }

        // Over Completion Rotation
        if (isLegalDelivery && (isSuperOver ? battingTeam.superOverBalls : battingTeam.overs) % 6 === 0) {
            const temp = newMatch.currentStrikerId;
            newMatch.currentStrikerId = newMatch.currentNonStrikerId;
            newMatch.currentNonStrikerId = temp;
            newMatch.currentBowlerId = undefined;
        }

        setMatch(newMatch);

        // Push live score to Supabase for public viewing
        if (authUser && newMatch.id) {
            pushLiveScore(newMatch.id, authUser.id, newMatch);
        }
    };

    const ensureSuperOverStats = (players: Player[], id: string) => {
        return players.map(p => {
            if (p.id === id && !p.superOverStats) {
                return {
                    ...p,
                    superOverStats: { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, dismissalType: DismissalType.NONE, oversBowled: 0, runsConceded: 0, wickets: 0, maidens: 0 }
                };
            }
            return p;
        });
    };

    const handleStrikerSelect = (id: string) => {
        saveStateForUndo();
        setMatch(prev => {
            if (!prev) return null;
            let teamA = { ...prev.teamA };
            let teamB = { ...prev.teamB };

            if (prev.currentInnings > 2) {
                teamA.players = ensureSuperOverStats(teamA.players, id);
                teamB.players = ensureSuperOverStats(teamB.players, id);
            }
            return { ...prev, teamA, teamB, currentStrikerId: id };
        });
    };

    const handleNonStrikerSelect = (id: string) => {
        saveStateForUndo();
        setMatch(prev => {
            if (!prev) return null;
            let teamA = { ...prev.teamA };
            let teamB = { ...prev.teamB };

            if (prev.currentInnings > 2) {
                teamA.players = ensureSuperOverStats(teamA.players, id);
                teamB.players = ensureSuperOverStats(teamB.players, id);
            }
            return { ...prev, teamA, teamB, currentNonStrikerId: id };
        });
    };

    const handleBowlerSelect = (id: string) => {
        saveStateForUndo();
        setMatch(prev => {
            if (!prev) return null;
            let teamA = { ...prev.teamA };
            let teamB = { ...prev.teamB };

            if (prev.currentInnings > 2) {
                teamA.players = ensureSuperOverStats(teamA.players, id);
                teamB.players = ensureSuperOverStats(teamB.players, id);
            }
            return { ...prev, teamA, teamB, currentBowlerId: id };
        });
    };

    const handlePlayerRename = (playerId: string, newName: string) => {
        if (!match) return;
        const updatedMatch = { ...match };

        const updateInTeam = (team: Team) => {
            const pIndex = team.players.findIndex(p => p.id === playerId);
            if (pIndex > -1) {
                team.players[pIndex] = { ...team.players[pIndex], name: newName };
            }
        };

        updateInTeam(updatedMatch.teamA);
        updateInTeam(updatedMatch.teamB);

        setMatch(updatedMatch);
    };

    if (view === 'ABOUT') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView={view} onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <div className="p-4">
                    <AboutView />
                </div>
            </div>
        )
    }

    if (view === 'TEAMS') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView={view} onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <TeamsView 
                    teams={persistentTeams} 
                    isLoading={isPlayersLoading} 
                    onSaveTeam={async (team) => {
                        const newTeams = [...persistentTeams.filter(t => t.id !== team.id), team];
                        setPersistentTeams(newTeams);
                        if (authUser) await saveTeam(authUser.id, team);
                    }} 
                    onDeleteTeam={async (teamId) => {
                        setPersistentTeams(prev => prev.filter(t => t.id !== teamId));
                        if (authUser) await deleteTeam(teamId);
                    }} 
                />
            </div>
        )
    }

    if (view === 'PROFILE') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView={view} onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                {authUser ? (
                    <ProfileView
                        userProfile={userProfile}
                        dbPlayers={dbPlayers}
                        onViewStats={(player) => {
                            setSelectedPlayer(player);
                            setView('PLAYER_PROFILE');
                        }}
                        onSave={async (p) => {
                            setUserProfile(p);
                            if (authUser) await saveProfile(authUser.id, p);
                            setView('HOME');
                        }}
                        onLogout={handleLogout}
                    />
                ) : (
                    <div className="max-w-md mx-auto mt-8 px-4">
                        <AuthScreen onAuthSuccess={() => setView('HOME')} />
                    </div>
                )}
            </div>
        )
    }

    if (view === 'PLAYERS') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView={view} onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <PlayersView
                    players={dbPlayers}
                    isLoading={isPlayersLoading}
                    onPlayerClick={(player) => {
                        setSelectedPlayer(player);
                        setView('PLAYER_PROFILE');
                    }}
                />
            </div>
        )
    }

    if (view === 'PLAYER_PROFILE' && selectedPlayer) {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView="HISTORY" onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <PlayerProfileView
                    player={selectedPlayer}
                    allPlayers={dbPlayers}
                    allMatches={history}
                    onBack={() => setView('PLAYERS')}
                    onMatchClick={(m) => {
                        // Navigate to match detail — for now go to HISTORY
                        setView('HISTORY');
                    }}
                />
            </div>
        )
    }

    if (view === 'NOTIFICATIONS') {
        return (
            <div className="min-h-screen bg-primary font-sans relative">
                <Navbar activeView="NOTIFICATIONS" onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <NotificationsView userProfile={userProfile} />
            </div>
        )
    }

    // ─── Tournament Views ──────────────────────────────────────────────────────
    if (view === 'COMMUNITY') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView="COMMUNITY" onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <CommunityBoard />
            </div>
        )
    }

    if (view === 'TOURNAMENT_HOME') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView={view} onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-accent flex items-center gap-3">
                                <Trophy className="w-8 h-8" /> Tournaments
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} hosted</p>
                        </div>
                        <button onClick={() => requireAuth(() => setView('TOURNAMENT_SETUP'))}
                            className="flex items-center gap-2 px-5 py-3 bg-accent text-white font-black rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition-colors">
                            + Host Tournament
                        </button>
                    </div>

                    {tournaments.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
                            <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No Tournaments Yet</h3>
                            <p className="text-gray-400 max-w-sm mx-auto mb-6">Host your first tournament and manage all fixtures from one place.</p>
                            <button onClick={() => requireAuth(() => setView('TOURNAMENT_SETUP'))}
                                className="px-6 py-3 bg-accent text-white font-bold rounded-xl">
                                Create Tournament
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournaments.map(t => {
                                const isCompleted = t.status === 'COMPLETED';
                                const matchesDone = t.fixtures.filter(f => f.status === 'COMPLETED').length;
                                const progress = t.fixtures.length > 0 ? (matchesDone / t.fixtures.length) * 100 : 0;
                                
                                return (
                                <div key={t.id}
                                    onClick={() => { setActiveTournament(t); setView('TOURNAMENT_VIEW'); }}
                                    className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2 border border-gray-100 flex flex-col justify-between min-h-[220px] cursor-pointer"
                                >
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 'bg-gradient-to-br from-purple-50 to-fuchsia-100'}`}></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
                                                isCompleted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700 animate-pulse'
                                            }`}>
                                                {isCompleted ? '✓ Completed' : '🔴 Active'}
                                            </span>
                                            <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-lg">
                                                {t.format}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-gray-900 text-xl leading-tight mb-2 group-hover:text-accent transition-colors">
                                            {t.name}
                                        </h3>
                                        <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
                                            <Users className="w-4 h-4" /> {t.teams.length} Teams
                                        </p>
                                    </div>
                                    
                                    <div className="relative z-10 mt-6">
                                        {t.champion ? (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-yellow-600" />
                                                <span className="font-black text-yellow-700 truncate">{t.champion}</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                                    <span>Progress: {matchesDone}/{t.fixtures.length}</span>
                                                    <span>{Math.round(progress)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 w-full overflow-hidden">
                                                    <div className="bg-accent h-1.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (view === 'TOURNAMENT_SETUP') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView="TOURNAMENT_HOME" onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <TournamentSetup
                    onTournamentCreate={handleTournamentCreate}
                    onBack={() => setView('TOURNAMENT_HOME')}
                />
            </div>
        )
    }

    if (view === 'TOURNAMENT_VIEW' && activeTournament) {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView="TOURNAMENT_HOME" onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <TournamentView
                    tournament={activeTournament}
                    matches={history.filter(m => m.tournamentId === activeTournament.id && m.status === MatchStatus.COMPLETED)}
                    onStartFixtureMatch={handleTournamentMatchStart}
                    onBack={() => setView('TOURNAMENT_HOME')}
                    onDeleteTournament={async () => {
                        const ok = await showConfirm({ title: 'Delete Tournament?', message: 'This tournament and all its data will be permanently removed.', confirmText: 'Delete', variant: 'danger' });
                        if (!ok) return;
                        const tid = activeTournament.id;
                        setTournaments(prev => prev.filter(t => t.id !== tid));
                        setActiveTournament(null);
                        setView('TOURNAMENT_HOME');
                        deleteTournament(tid);
                        toast('Tournament deleted', 'info');
                    }}
                />
            </div>
        )
    }

    if (view === 'SETUP_TOURNAMENT_MATCH' && activeTournament && activeTournamentFixture) {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView="TOURNAMENT_HOME" onViewChange={handleViewChange} isMatchActive={false} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <div className="max-w-xl mx-auto px-4 py-6">
                    <div className="mb-4 flex items-center gap-2">
                        <button onClick={() => { setView('TOURNAMENT_VIEW'); setActiveTournamentFixture(null); }}
                            className="text-gray-500 hover:text-accent font-medium flex items-center gap-1 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Back to Fixtures
                        </button>
                    </div>
                    <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
                        <p className="text-xs font-black text-accent uppercase tracking-widest mb-1">{activeTournamentFixture.label}</p>
                        <p className="font-black text-gray-800 text-lg">{activeTournamentFixture.team1} vs {activeTournamentFixture.team2}</p>
                        <p className="text-gray-500 text-sm">{activeTournament.overs} overs · {activeTournament.playersPerTeam ?? 11} players · {activeTournament.name}</p>
                    </div>
                    <MatchSetup
                        userProfile={userProfile}
                        dbPlayers={dbPlayers}
                        defaultOvers={activeTournament.overs}
                        initialData={{
                            teamAName: activeTournamentFixture.team1,
                            teamBName: activeTournamentFixture.team2,
                            teamASquad: Array(activeTournament.playersPerTeam ?? 11).fill(''),
                            teamBSquad: Array(activeTournament.playersPerTeam ?? 11).fill(''),
                        }}
                        onMatchCreate={(teamA, teamB, overs) => {
                            const newMatch: Match = {
                                id: crypto.randomUUID(),
                                date: Date.now(),
                                status: MatchStatus.TOSS,
                                totalOvers: overs,
                                teamA, teamB,
                                currentInnings: 1,
                                balls: [],
                                tournamentId: activeTournament.id,
                                fixtureId: activeTournamentFixture.id,
                            };
                            // Update fixture matchId
                            const updatedFixtures = activeTournament.fixtures.map(f =>
                                f.id === activeTournamentFixture.id ? { ...f, matchId: newMatch.id } : f
                            );
                            const updatedTournament = { ...activeTournament, fixtures: updatedFixtures };
                            setActiveTournament(updatedTournament);
                            setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
                            if (authUser) saveTournament(authUser.id, updatedTournament);
                            setMatch(newMatch);
                            setUndoStack([]);
                            setView('MATCH');
                        }}
                    />
                </div>
            </div>
        )
    }

    if (view === 'SERIES_SUMMARY') {
        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView="HOME" onViewChange={handleViewChange} isMatchActive={false} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-center">
                        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-12">
                            <Trophy className="w-24 h-24 mx-auto text-yellow-400 mb-4 animate-bounce" />
                            <h2 className="text-4xl font-black mb-2 uppercase tracking-wide">Series Champion</h2>
                            <div className="text-5xl font-bold text-yellow-300 drop-shadow-md mb-2">
                                {selectedCompletedSeries?.winner}
                            </div>
                            <p className="text-indigo-200 text-lg">
                                {selectedCompletedSeries?.name}
                            </p>
                        </div>

                        <div className="p-8">
                            {selectedCompletedSeries?.manOfSeries && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-sm mx-auto -mt-16 relative z-10 shadow-lg">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Man of the Series</div>
                                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-md overflow-hidden mb-3">
                                        {selectedCompletedSeries.manOfSeries.avatar ? (
                                            <img src={selectedCompletedSeries.manOfSeries.avatar} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-10 h-10 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedCompletedSeries.manOfSeries.name}</div>
                                    <div className="flex justify-center gap-4 mt-2 text-gray-600 font-medium">
                                        <div>{selectedCompletedSeries.manOfSeries.runs} Runs</div>
                                        <div>{selectedCompletedSeries.manOfSeries.wickets} Wickets</div>
                                    </div>
                                </div>
                            )}

                            <h3 className="font-bold text-xl text-gray-800 mt-10 mb-6 flex items-center justify-center gap-2">
                                <History className="w-6 h-6 text-accent" /> Series Match History
                            </h3>

                            <div className="space-y-4 max-w-2xl mx-auto">
                                {selectedCompletedSeries?.matches.map((m, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => { setMatch(m); setView('LIVE'); }}
                                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Match {idx + 1}</div>
                                            <div className="font-bold text-gray-800 text-lg">{m.teamA.name} vs {m.teamB.name}</div>
                                            <div className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Winner</div>
                                            <div className="font-bold text-green-600 text-lg">
                                                {m.winningTeamId ? (m.winningTeamId === m.teamA.id ? m.teamA.name : m.teamB.name) : 'Draw'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setView('HOME')}
                                className="mt-10 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ... (History View implementation remains same, just ensuring default export is at end) ...

    if (view === 'HISTORY') {
        const filteredHistory = history.filter(m => {
            let matchesQuery = true;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const dateStr = new Date(m.date).toLocaleDateString().toLowerCase();
                const teamA = m.teamA.name.toLowerCase();
                const teamB = m.teamB.name.toLowerCase();
                matchesQuery = teamA.includes(q) || teamB.includes(q) || dateStr.includes(q);
            }

            let matchesType = true;
            if (historyFilter === 'SINGLE') matchesType = !m.seriesId;
            if (historyFilter === 'SERIES') matchesType = !!m.seriesId;

            return matchesQuery && matchesType;
        });

        const completedTournaments = tournaments.filter(t => t.status === 'COMPLETED' && (
            searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase())
        ));

        return (
            <div className="min-h-screen bg-primary">
                <Navbar activeView={view} onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h2 className="text-3xl font-bold text-accent flex items-center gap-3">
                            <History className="w-8 h-8" /> Match History
                        </h2>

                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search team or date..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:bg-white focus:border-accent outline-none font-medium placeholder-gray-500 w-full md:w-64"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        <button
                            onClick={() => setHistoryFilter('ALL')}
                            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${historyFilter === 'ALL' ? 'bg-accent text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Filter className="w-4 h-4" /> All Matches
                        </button>
                        <button
                            onClick={() => setHistoryFilter('SINGLE')}
                            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${historyFilter === 'SINGLE' ? 'bg-accent text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            <User className="w-4 h-4" /> Single Matches
                        </button>
                        <button
                            onClick={() => setHistoryFilter('SERIES')}
                            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${historyFilter === 'SERIES' ? 'bg-accent text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Layers className="w-4 h-4" /> Series Matches
                        </button>
                        <button
                            onClick={() => setHistoryFilter('TOURNAMENTS')}
                            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${historyFilter === 'TOURNAMENTS' ? 'bg-accent text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Trophy className="w-4 h-4" /> Tournaments
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {historyFilter === 'TOURNAMENTS' ? (
                            completedTournaments.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No completed tournaments found.</p>
                                </div>
                            ) : (
                                completedTournaments.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => { setActiveTournament(t); setView('TOURNAMENT_VIEW'); }}
                                        className="bg-white p-6 rounded-xl shadow-sm border border-secondary/30 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                            TOURNAMENT
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar className="w-3 h-3" /> {new Date(t.date).toLocaleDateString()}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                Completed
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 mb-4">
                                            <div className="text-2xl font-black text-gray-900">{t.name}</div>
                                            <div className="text-sm text-gray-500 font-medium">
                                                {t.format === 'KNOCKOUT' ? 'Knockout' : 'League'} Format • {t.teams.length} Teams
                                            </div>
                                        </div>
                                        {t.champion && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-yellow-500" />
                                                <span className="font-bold text-gray-800">Champion:</span>
                                                <span className="font-black text-accent">{t.champion}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : filteredHistory.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No matches found.</p>
                            </div>
                        ) : (
                            filteredHistory.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => { 
                                        setMatch(m); 
                                        if (m.status === MatchStatus.SCHEDULED) {
                                            setView('TOSS');
                                        } else {
                                            setView('LIVE');
                                        }
                                    }}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-secondary/30 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
                                >
                                    {m.seriesId && (
                                        <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                            SERIES MATCH
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> {m.status === MatchStatus.SCHEDULED ? new Date(m.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : new Date(m.date).toLocaleDateString()}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            m.status === MatchStatus.COMPLETED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                            m.status === MatchStatus.TIED ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                                            m.status === MatchStatus.SCHEDULED ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                            {m.status === MatchStatus.COMPLETED ? 'Completed' : 
                                             m.status === MatchStatus.TIED ? 'Tied' : 
                                             m.status === MatchStatus.SCHEDULED ? 'Scheduled' : 
                                             'In Progress'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <div className={`text-lg font-bold ${m.winningTeamId && m.winningTeamId !== m.teamA.id ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {m.teamA.name}
                                            </div>
                                            {m.status !== MatchStatus.SCHEDULED && (
                                                <div className={`text-lg font-black ${m.winningTeamId && m.winningTeamId !== m.teamA.id ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {m.teamA.totalRuns}/{m.teamA.wickets} <span className="text-xs text-gray-500 font-medium dark:text-gray-400">({Math.floor(m.teamA.overs / 6)}.{m.teamA.overs % 6} Ov)</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className={`text-lg font-bold ${m.winningTeamId && m.winningTeamId !== m.teamB.id ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                                {m.teamB.name}
                                            </div>
                                            {m.status !== MatchStatus.SCHEDULED && (
                                                <div className={`text-lg font-black ${m.winningTeamId && m.winningTeamId !== m.teamB.id ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {m.teamB.totalRuns}/{m.teamB.wickets} <span className="text-xs text-gray-500 font-medium dark:text-gray-400">({Math.floor(m.teamB.overs / 6)}.{m.teamB.overs % 6} Ov)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 flex justify-between items-center">
                                        <div className="text-sm font-bold text-accent dark:text-blue-400">
                                            {m.status === MatchStatus.SCHEDULED ? 'Match yet to begin' : 
                                             m.status === MatchStatus.COMPLETED ? (
                                                m.winningTeamId ? `${m.winningTeamId === m.teamA.id ? m.teamA.name : m.teamB.name} won` : 'Match Drawn / Tied'
                                             ) : 'Match in progress'}
                                        </div>
                                        {m.status === MatchStatus.SCHEDULED && (
                                            <div className="text-white font-bold bg-indigo-600 hover:bg-indigo-700 text-xs px-3 py-1.5 rounded-lg transition-colors">Start Match</div>
                                        )}
                                        {m.status === MatchStatus.LIVE && (
                                            <div className="text-white font-bold bg-red-600 hover:bg-red-700 animate-pulse text-xs px-3 py-1.5 rounded-lg transition-colors">Resume</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ─── Auth Guard ───────────────────────────────────────────────────────────
    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c2340 70%, #0f172a 100%)' }}
            >
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-30 animate-pulse" />
                    <img
                        src="https://i.postimg.cc/fRdWdn9t/20251127-224320.png"
                        alt="ARcricinfo"
                        className="relative w-20 h-20 rounded-full border-2 border-yellow-400/60 object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-medium tracking-wider">Loading ARcricinfo...</p>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-primary font-sans relative">
            <AnimationOverlay event={animEvent} onComplete={handleAnimComplete} />
            <Navbar activeView={match ? 'LIVE' : 'HOME'} onViewChange={handleViewChange} isMatchActive={!!match && match.status === MatchStatus.LIVE} userProfile={userProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

            {!match ? (
                <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 animate-fade-in bg-gray-50 dark:bg-slate-900 transition-colors">

                    {view === 'HOME' ? (
                        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12">
                            
                            {/* Hero Header */}
                            <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-accent text-white p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 group">
                                {/* Animated Blobs */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                                <div className="absolute bottom-0 left-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
                                <div className="absolute top-1/2 left-2/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="text-center md:text-left">
                                        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                                            {userProfile ? `Welcome, ${userProfile.name.split(' ')[0]}!` : 'ARcricinfo'} <span className="text-yellow-400">🏏</span>
                                        </h1>
                                        <p className="text-lg md:text-xl text-blue-200 max-w-2xl font-medium">
                                            The ultimate platform to manage your tournaments, track live matches, and analyze player statistics in real-time.
                                        </p>
                                    </div>
                                    <div className="hidden lg:block">
                                        <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border-4 border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform duration-500">
                                            <Trophy className="w-16 h-16 text-yellow-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ongoing Match/Series Alert */}
                            {series && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-indigo-500/50 p-6 rounded-2xl shadow-lg flex justify-between items-center transform transition-transform hover:-translate-y-1">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 dark:bg-indigo-900/40 p-3 rounded-full text-blue-600 dark:text-indigo-400 animate-pulse">
                                            <PlayCircle className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-blue-900 dark:text-indigo-300 font-bold uppercase tracking-wider text-sm mb-1">Ongoing Series</h3>
                                            <div className="text-2xl font-black text-gray-800 dark:text-white">{series.teamAName} <span className="text-gray-400 text-lg mx-1">vs</span> {series.teamBName}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                                                Score: <span className="text-blue-600 dark:text-indigo-400 font-bold">{series.teamAWins}</span> - <span className="text-blue-600 dark:text-indigo-400 font-bold">{series.teamBWins}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setView('SERIES_DASHBOARD')}
                                        className="px-6 py-3 bg-blue-600 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-indigo-500 transition-colors shadow-md"
                                    >
                                        Resume Action
                                    </button>
                                </div>
                            )}

                            {/* Core Actions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <button
                                    onClick={() => requireAuth(() => setView('SETUP'))}
                                    className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2 border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center gap-4 min-h-[200px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-700 dark:to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-full group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white dark:group-hover:bg-green-500 transition-all duration-300 shadow-sm">
                                        <PlayCircle className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <span className="text-xl font-bold text-gray-800 dark:text-white block mb-1">New Match</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Play instantly or schedule it</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => requireAuth(() => setView('TOURNAMENT_HOME'))}
                                    className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2 border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center gap-4 min-h-[200px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-slate-700 dark:to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-4 rounded-full group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white dark:group-hover:bg-purple-500 transition-all duration-300 shadow-sm">
                                        <Trophy className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <span className="text-xl font-bold text-gray-800 dark:text-white block mb-1">Tournaments</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Host, schedule & manage</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => requireAuth(() => handleStartSeries())}
                                    className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2 border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center gap-4 min-h-[200px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-4 rounded-full group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-500 transition-all duration-300 shadow-sm">
                                        <Layers className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <span className="text-xl font-bold text-gray-800 dark:text-white block mb-1">Series</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Multi-game clash</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setView('HISTORY')}
                                    className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg transition-all hover:shadow-2xl hover:-translate-y-2 border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center gap-4 min-h-[200px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-700 dark:to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-4 rounded-full group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white dark:group-hover:bg-orange-500 transition-all duration-300 shadow-sm">
                                        <History className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <div className="relative z-10 text-center">
                                        <span className="text-xl font-bold text-gray-800 dark:text-white block mb-1">History</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Match Archives</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : view === 'SERIES_SETUP' || view === 'SERIES_DASHBOARD' ? (
                        view === 'SERIES_SETUP' ? (
                            <MatchSetup
                                onMatchCreate={handleSeriesMatchCreate}
                                userProfile={userProfile}
                                dbPlayers={dbPlayers}
                                initialData={series ? {
                                    teamAName: series.teamAName,
                                    teamBName: series.teamBName,
                                    teamASquad: series.teamASquad,
                                    teamBSquad: series.teamBSquad
                                } : undefined}
                                userTeams={persistentTeams}
                            />
                        ) : (
                            // SERIES DASHBOARD
                            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                                {series && (
                                    <>
                                        <div className="bg-accent p-8 text-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                                            <div className="relative z-10 text-center">
                                                <h2 className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2">Series Dashboard</h2>
                                                <h1 className="text-4xl font-black mb-4">{series.teamAName} vs {series.teamBName}</h1>
                                                <div className="flex justify-center items-center gap-8 text-2xl font-bold">
                                                    <div className="bg-white/10 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/20">
                                                        {series.teamAName}: {series.teamAWins}
                                                    </div>
                                                    <div className="text-blue-300">vs</div>
                                                    <div className="bg-white/10 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/20">
                                                        {series.teamBName}: {series.teamBWins}
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-blue-200 text-sm">Matches Played: {series.matches.length}</div>
                                            </div>
                                        </div>

                                        <div className="p-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                <button
                                                    onClick={() => setView('SERIES_SETUP')}
                                                    className="p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl flex items-center justify-center gap-3 transition-colors group"
                                                >
                                                    <div className="bg-blue-500 text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                                                        <PlayCircle className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-bold text-gray-900 text-lg">Play Match {series.matches.length + 1}</div>
                                                        <div className="text-gray-500 text-sm">Squads pre-filled</div>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={handleEndSeries}
                                                    className="p-6 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl flex items-center justify-center gap-3 transition-colors group"
                                                >
                                                    <div className="bg-red-500 text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                                                        <Flag className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-bold text-gray-900 text-lg">End Series</div>
                                                        <div className="text-gray-500 text-sm">Declare Winner & MVP</div>
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <History className="w-5 h-5 text-gray-500" /> Series History
                                                </h3>
                                                {series.matches.length === 0 ? (
                                                    <p className="text-gray-500 italic text-center py-4">No matches played yet.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {series.matches.map((m, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => { setMatch(m); setView('LIVE'); }}
                                                                className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                                            >
                                                                <div>
                                                                    <span className="text-xs font-bold text-gray-400 uppercase">Match {idx + 1}</span>
                                                                    <div className="font-bold text-gray-800">{m.teamA.name} vs {m.teamB.name}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-xs text-gray-500">Winner</div>
                                                                    <div className="font-bold text-green-600">
                                                                        {m.winningTeamId ? (m.winningTeamId === m.teamA.id ? m.teamA.name : m.teamB.name) : 'Draw'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    ) : (
                        // New Match Setup (Standard)
                        <MatchSetup 
                            onMatchCreate={handleMatchCreate} 
                            onScheduleMatch={handleScheduleMatch}
                            userProfile={userProfile} 
                            userTeams={persistentTeams}
                            dbPlayers={dbPlayers} 
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-5xl mx-auto p-4 pb-24 md:pb-8">
                    {(match.status === MatchStatus.TOSS || match.status === MatchStatus.SCHEDULED) && (
                        <TossInterface match={match} onComplete={handleTossComplete} />
                    )}

                    {match.status === MatchStatus.TIED && (
                        <SuperOverInterface onPlaySuperOver={handlePlaySuperOver} onSkip={handleSkipSuperOver} />
                    )}

                    <MatchDashboard match={match} onPlayerUpdate={handlePlayerRename} />

                    {match.status === MatchStatus.LIVE && (
                        <>
                            <LiveScorer
                                match={match}
                                onScoreUpdate={updateMatchState}
                                onUndo={handleUndo}
                                canUndo={undoStack.length > 0}
                                onMatchEnd={async () => {
                                    const ok = await showConfirm({ title: 'End Match?', message: 'Are you sure you want to end this match? The result will be finalized.', confirmText: 'End Match', variant: 'warning' });
                                    if (!ok) return;
                                    const endedMatch = { ...match, status: MatchStatus.COMPLETED };
                                    setMatch(endedMatch);
                                    saveToHistory(endedMatch);
                                    if (match.id) removeLiveScore(match.id);
                                }}
                                onPause={() => setMatch(null)}
                            />

                            {/* Live Score Share Link */}
                            {match.id && (
                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}${window.location.pathname}?live=${match.id}`;
                                            navigator.clipboard.writeText(url);
                                            toast('Live score link copied! Share it so others can watch live.', 'success');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                                    >
                                        📡 Copy Live Score Link
                                    </button>
                                </div>
                            )}

                            {/* Abandon Match (during live play) */}
                            <div className="mt-2 flex justify-center">
                                <button
                                    onClick={async () => {
                                        const ok = await showConfirm({ title: 'Abandon Match?', message: 'This will discard the current match. This action cannot be undone.', confirmText: 'Abandon', variant: 'danger' });
                                        if (!ok) return;
                                        if (match.id) removeLiveScore(match.id);
                                        setMatch(null);
                                        toast('Match abandoned', 'warning');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-600 text-xs font-bold transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Abandon Match
                                </button>
                            </div>

                            {/* Modals for Player Selection */}
                            {!match.currentStrikerId && (
                                <PlayerSelectModal
                                    players={match.currentInnings === 1
                                        ? (match.teamA.isBatting ? match.teamA.players : match.teamB.players)
                                        : match.currentInnings === 2
                                            ? (match.teamA.isBatting ? match.teamA.players : match.teamB.players)
                                            // Super Over Innings (3 = Team A, 4 = Team B)
                                            : match.currentInnings === 3
                                                ? match.teamA.players
                                                : match.teamB.players
                                    }
                                    label="Striker"
                                    onSelect={handleStrikerSelect}
                                    disabledIds={[match.currentNonStrikerId || '']}
                                    variant="BATSMAN"
                                    ignoreStats={match.currentInnings > 2}
                                />
                            )}

                            {match.currentStrikerId && !match.currentNonStrikerId && (
                                <PlayerSelectModal
                                    players={match.currentInnings === 1
                                        ? (match.teamA.isBatting ? match.teamA.players : match.teamB.players)
                                        : match.currentInnings === 2
                                            ? (match.teamA.isBatting ? match.teamA.players : match.teamB.players)
                                            : match.currentInnings === 3
                                                ? match.teamA.players
                                                : match.teamB.players
                                    }
                                    label="Non-Striker"
                                    onSelect={handleNonStrikerSelect}
                                    disabledIds={[match.currentStrikerId || '']}
                                    variant="BATSMAN"
                                    ignoreStats={match.currentInnings > 2}
                                />
                            )}

                            {!match.currentBowlerId && (
                                <PlayerSelectModal
                                    players={match.currentInnings === 1
                                        ? (match.teamA.isBatting ? match.teamB.players : match.teamA.players)
                                        : match.currentInnings === 2
                                            ? (match.teamA.isBatting ? match.teamB.players : match.teamA.players)
                                            : match.currentInnings === 3
                                                ? match.teamB.players
                                                : match.teamA.players
                                    }
                                    label={
                                        // For Super Over, always show 'Bowler', otherwise check over count
                                        (match.currentInnings > 2 ? 0 : (match.teamA.isBatting ? match.teamA.overs : match.teamB.overs)) === 0 ? "Bowler" : "Next Bowler"
                                    }
                                    onSelect={handleBowlerSelect}
                                    disabledIds={
                                        match.currentInnings > 2
                                            ? []
                                            : [
                                                (() => {
                                                    if (match.balls.length > 0) {
                                                        return match.balls[match.balls.length - 1].bowlerId;
                                                    }
                                                    return '';
                                                })()
                                            ]
                                    }
                                    variant="BOWLER"
                                    ignoreStats={match.currentInnings > 2}
                                />
                            )}
                        </>
                    )}

                    {match.status === MatchStatus.COMPLETED && (
                        <div className="bg-white p-8 rounded-xl shadow-lg text-center mt-6 animate-fade-in">
                            <div className="mb-6">
                                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                                <h2 className="text-3xl font-black text-gray-900 mb-2">Match Completed</h2>
                                <p className="text-xl text-gray-600">
                                    {match.winningTeamId ? (
                                        <>
                                            <span className="font-bold text-accent">
                                                {match.winningTeamId === match.teamA.id ? match.teamA.name : match.teamB.name}
                                            </span> Won the Match!
                                        </>
                                    ) : 'Match Ended in a Draw'}
                                </p>
                            </div>

                            {match.manOfTheMatchId && (() => {
                                const allPlayers = [...match.teamA.players, ...match.teamB.players];
                                const motm = allPlayers.find(p => p.id === match.manOfTheMatchId);
                                if (!motm) return null;
                                return (
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-blue-100 mb-8 max-w-sm mx-auto shadow-sm">
                                        <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Man of the Match</div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden mb-3">
                                                {motm.avatar ? (
                                                    <img src={motm.avatar} className="w-full h-full object-cover" alt={motm.name} />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                        <User className="w-10 h-10 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{motm.name}</div>
                                            <div className="text-gray-500 font-medium text-sm mt-1 flex gap-3">
                                                {motm.runs > 0 && <span>{motm.runs} Runs</span>}
                                                {motm.wickets > 0 && <span>{motm.wickets} Wickets</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {series && match.seriesId === series.id ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setMatch(null); setView('SERIES_DASHBOARD'); }}
                                        className="w-full max-w-xs px-6 py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 shadow-lg transition-transform active:scale-95"
                                    >
                                        Back to Series Dashboard
                                    </button>
                                </div>
                            ) : activeTournament && match.tournamentId === activeTournament.id ? (
                                <button
                                    onClick={() => { setMatch(null); setActiveTournamentFixture(null); setView('TOURNAMENT_VIEW'); }}
                                    className="w-full max-w-xs px-6 py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 shadow-lg transition-transform active:scale-95"
                                >
                                    Back to Tournament
                                </button>
                            ) : (
                                <button
                                    onClick={() => setMatch(null)}
                                    className="w-full max-w-xs px-6 py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 shadow-lg transition-transform active:scale-95"
                                >
                                    Start New Match
                                </button>
                            )}

                            {/* Rematch + Delete */}
                            <div className="flex gap-3 mt-4 max-w-md mx-auto">
                                <button
                                    onClick={() => {
                                        const rematch: Match = {
                                            id: crypto.randomUUID(),
                                            date: Date.now(),
                                            status: MatchStatus.TOSS,
                                            totalOvers: match.totalOvers,
                                            teamA: { ...match.teamA, totalRuns: 0, wickets: 0, overs: 0, extras: 0, isBatting: false, players: match.teamA.players.map(p => ({ ...p, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, oversBowled: 0, runsConceded: 0, wickets: 0, maidens: 0, dotBalls: 0, catches: 0, stumpings: 0, strikeRate: 0, economy: 0 })) },
                                            teamB: { ...match.teamB, totalRuns: 0, wickets: 0, overs: 0, extras: 0, isBatting: false, players: match.teamB.players.map(p => ({ ...p, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, oversBowled: 0, runsConceded: 0, wickets: 0, maidens: 0, dotBalls: 0, catches: 0, stumpings: 0, strikeRate: 0, economy: 0 })) },
                                            currentInnings: 1,
                                            balls: [],
                                            seriesId: match.seriesId,
                                            tournamentId: match.tournamentId,
                                            fixtureId: match.fixtureId,
                                        };
                                        setMatch(rematch);
                                        setUndoStack([]);
                                    }}
                                    className="flex-1 px-4 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    🔄 Rematch
                                </button>
                                <button
                                    onClick={async () => {
                                        const ok = await showConfirm({ title: 'Delete Match?', message: 'This match will be removed from history permanently.', confirmText: 'Delete', variant: 'danger' });
                                        if (!ok) return;
                                        const mid = match.id;
                                        setHistory(prev => prev.filter(m => m.id !== mid));
                                        setMatch(null);
                                        if (mid) deleteMatch(mid);
                                        toast('Match deleted', 'info');
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    🗑️ Delete Match
                                </button>
                            </div>

                            {/* Share Scorecard */}
                            <div className="mt-6 max-w-md mx-auto">
                                <ShareScorecard match={match} />
                            </div>

                            {/* Wagon Wheel */}
                            <div className="mt-6 max-w-lg mx-auto">
                                <WagonWheel balls={match.balls} size={280} />
                            </div>

                            {/* Match Analytics */}
                            <div className="mt-6 max-w-lg mx-auto">
                                <MatchAnalytics match={match} />
                            </div>

                            {/* Ball-by-Ball Timeline */}
                            <div className="mt-6 max-w-lg mx-auto">
                                <BallTimeline 
                                    match={match} 
                                    onEditBall={(b) => {
                                        setEditingHistoricalBall(b);
                                        setHistoricalEditRuns(b.runsScored);
                                        setHistoricalEditExtraRuns(b.extraRuns || 0);
                                        setHistoricalEditExtraType(b.extraType);
                                    }}
                                />
                            </div>

                            {/* Partnerships */}
                            <div className="mt-6 max-w-lg mx-auto space-y-4">
                                <PartnershipsView
                                    partnerships={computePartnerships(match, 1)}
                                    teamName={match.battingFirstId === match.teamA.id ? match.teamA.name : match.teamB.name}
                                />
                                <PartnershipsView
                                    partnerships={computePartnerships(match, 2)}
                                    teamName={match.battingFirstId === match.teamA.id ? match.teamB.name : match.teamA.name}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Historical Edit Modal Overlay */}
            {editingHistoricalBall && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEditingHistoricalBall(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-up border border-gray-100" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-gray-800">Edit Past Ball</h3>
                            <button onClick={() => setEditingHistoricalBall(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Runs Scored (Bat)</label>
                                <input type="number" min="0" max="6" value={historicalEditRuns} onChange={e => setHistoricalEditRuns(parseInt(e.target.value) || 0)} className="w-full p-2 border-2 text-center text-lg font-black border-gray-200 rounded-lg focus:border-accent outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Extra Type</label>
                                    <select value={historicalEditExtraType} onChange={e => setHistoricalEditExtraType(e.target.value as ExtraType)} className="w-full p-2 border-2 font-bold text-sm border-gray-200 rounded-lg focus:border-accent outline-none">
                                        <option value={ExtraType.NONE}>None</option>
                                        <option value={ExtraType.WIDE}>Wide</option>
                                        <option value={ExtraType.NO_BALL}>No Ball</option>
                                        <option value={ExtraType.BYE}>Bye</option>
                                        <option value={ExtraType.LEG_BYE}>Leg Bye</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Extra Runs</label>
                                    <input type="number" min="0" max="4" disabled={historicalEditExtraType === ExtraType.NONE} value={historicalEditExtraRuns} onChange={e => setHistoricalEditExtraRuns(parseInt(e.target.value) || 0)} className="w-full text-center p-2 border-2 font-black border-gray-200 rounded-lg focus:border-accent outline-none disabled:bg-gray-100 disabled:text-gray-400" />
                                </div>
                            </div>
                            <div className="pt-2">
                                <button onClick={handleSaveHistoricalEdit} className="w-full py-3 bg-accent text-white font-black rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                                    Save Record
                                </button>
                                <p className="text-[10px] text-gray-400 font-bold text-center mt-3">*Wicket modifications locked in Retroactive Mode to preserve innings structure.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal Overlay */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
                    <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <X className="w-4 h-4 text-white" />
                        </button>
                        <AuthScreen onAuthSuccess={() => setShowAuthModal(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => (
    <ToastProvider>
        <AppInner />
    </ToastProvider>
);

export default App;
