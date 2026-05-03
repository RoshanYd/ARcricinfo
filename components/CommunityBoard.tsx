import React, { useState, useEffect } from 'react';
import { Target, Search, MessageSquarePlus, MapPin, Calendar, Users, Activity, Crown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { CommunityPost, MatchStatus, Match } from '../types';
import { loadCommunityPosts, saveCommunityPost, updatePostStatus, saveNotification, saveMatch } from '../utils/db';
import { useToast } from './Toast';

export interface CommunityBoardProps {
    userProfile: { id: string; name: string } | null;
    onChallengeAccepted?: () => void;
}

export const CommunityBoard: React.FC<CommunityBoardProps> = ({ userProfile, onChallengeAccepted }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'T20' | 'T10' | 'CUSTOM'>('ALL');
  const { toast } = useToast();

  useEffect(() => {
     async function fetchPosts() {
         const data = await loadCommunityPosts();
         setPosts(data);
         setIsLoading(false);
     }
     fetchPosts();
  }, []);

  // Form state
  const [teamName, setTeamName] = useState('');
  const [location, setLocation] = useState('');
  const [matchType, setMatchType] = useState<'T20' | 'T10' | 'TEST' | 'CUSTOM'>('T20');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const handlePostChallenge = async () => {
    if (!userProfile) {
        toast('You must be logged in to post a challenge.', 'error');
        return;
    }
    if (!teamName || !location || !date || !message) {
        toast('Please fill out all required fields.', 'error');
        return;
    }

    const newPost: CommunityPost = {
      id: Math.random().toString(36).substr(2, 9),
      userId: userProfile.id,
      teamName,
      location,
      date: new Date(date).getTime(),
      matchType,
      message,
      contactInfo,
      postedAt: Date.now(),
      status: 'OPEN'
    } as any; // Temporary fix for backwards compatibility

    // Fix the naming convention to match our interface updates
    const postToSave: CommunityPost = {
        ...newPost,
        createdAt: Date.now()
    };

    setPosts([postToSave, ...posts]);
    setIsModalOpen(false);
    
    // Fire to DB
    await saveCommunityPost(postToSave);
    toast('Challenge posted successfully!', 'success');

    // Reset Form
    setTeamName('');
    setLocation('');
    setMessage('');
    setContactInfo('');
  };

  const handleAcceptChallenge = async (post: CommunityPost) => {
      if (!userProfile) {
          toast('You must be logged in to accept challenges.', 'error');
          return;
      }
      if (post.userId === userProfile.id) {
          toast('You cannot accept your own challenge.', 'error');
          return;
      }

      // Optimistic update
      setPosts(posts.map(p => p.id === post.id ? { ...p, status: 'ACCEPTED' } : p));
      
      // Update DB Status
      await updatePostStatus(post.id, 'ACCEPTED');

      // Send a notification to the original post creator
      await saveNotification({
          id: crypto.randomUUID(),
          userId: post.userId,
          type: 'CHALLENGE_ACCEPTED',
          message: `${userProfile.name} has accepted your ${post.matchType} challenge in ${post.location}! Contact them to finalize details.`,
          isRead: false,
          createdAt: Date.now()
      });
      
      // Create a Scheduled Match for BOTH the acceptor and creator
      const newMatch: Match = {
          id: crypto.randomUUID(),
          date: post.date,
          status: MatchStatus.SCHEDULED,
          totalOvers: post.matchType === 'T20' ? 20 : post.matchType === 'T10' ? 10 : 0,
          teamA: { id: crypto.randomUUID(), name: post.teamName, isBatting: false, totalRuns: 0, wickets: 0, overs: 0, extras: 0, superOverRuns: 0, superOverWickets: 0, superOverBalls: 0, players: [] },
          teamB: { id: crypto.randomUUID(), name: "Opponent (You)", isBatting: false, totalRuns: 0, wickets: 0, overs: 0, extras: 0, superOverRuns: 0, superOverWickets: 0, superOverBalls: 0, players: [] },
          currentInnings: 1,
          balls: [],
      };
      
      await saveMatch(userProfile.id, newMatch);
      await saveMatch(post.userId, newMatch);

      toast('Challenge accepted! Scheduled match generated on your dashboard!', 'success');
      
      if (onChallengeAccepted) {
          onChallengeAccepted();
      }
  };

  const filteredPosts = filterType === 'ALL' ? posts : posts.filter(p => p.matchType === filterType);

  if (isLoading) {
      return <div className="flex flex-col items-center justify-center py-20 text-accent"><Loader2 className="w-10 h-10 animate-spin mb-4" /><p className="font-bold">Loading community posts...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-accent flex items-center gap-3">
            <Users className="w-8 h-8" /> Cricket Community
          </h2>
          <p className="text-gray-500 text-sm mt-1">Challenge local teams, find freelance players, or organize your weekend match.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-accent text-white font-black rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95"
        >
          <MessageSquarePlus className="w-5 h-5" /> Post Challenge
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
         {['ALL', 'T20', 'T10', 'CUSTOM'].map((type) => (
             <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 font-bold text-sm tracking-wide rounded-full transition-all whitespace-nowrap ${filterType === type ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
             >
                 {type === 'ALL' ? 'All Formats' : type}
             </button>
         ))}
      </div>

      {/* Feed */}
      <div className="grid gap-4">
        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-accent/40 transition-colors group relative overflow-hidden">
             
             {post.status === 'ACCEPTED' && (
                 <div className="absolute top-4 right-4 bg-gray-100 text-gray-400 font-bold px-3 py-1 text-[10px] rounded-full uppercase tracking-widest border border-gray-200">
                     Closed / Accepted
                 </div>
             )}

             <div className={`flex items-start gap-4 ${post.status === 'ACCEPTED' ? 'opacity-60' : ''}`}>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                     <Target className="w-6 h-6 text-gray-500" />
                 </div>
                 <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-gray-900 text-lg group-hover:text-accent transition-colors">{post.teamName}</h3>
                        <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">{post.matchType}</span>
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500 mb-3">
                         <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {post.location}</span>
                         <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(post.date, 'MMM do, yyyy - h:mm a')}</span>
                     </div>

                     <p className="text-gray-700 text-sm leading-relaxed mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                         "{post.message}"
                     </p>

                     <div className="flex items-center justify-between">
                         <span className="text-xs text-gray-400 font-medium">Posted {format(post.createdAt || post.postedAt, 'MMM d')}</span>
                         {post.status === 'OPEN' && (
                            <button 
                                onClick={() => handleAcceptChallenge(post)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 ${
                                    userProfile && post.userId === userProfile.id 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-accent text-white'
                                }`}
                                disabled={userProfile && post.userId === userProfile.id}
                            >
                                {userProfile && post.userId === userProfile.id ? 'Your Post' : 'Connect / Accept'}
                            </button>
                         )}
                     </div>
                 </div>
             </div>
          </div>
        ))}
        {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-600">No Challenges Found</h3>
                <p className="text-sm text-gray-400 mt-1">Be the first to post a new challenge for this format!</p>
            </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up border border-gray-100 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-black text-gray-900 mb-1">Post a Challenge</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">Find an opponent or recruit a freelancer!</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Your Team Name</label>
                        <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none" placeholder="e.g. Royal Challengers" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Format</label>
                            <select value={matchType} onChange={e => setMatchType(e.target.value as any)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none">
                                <option value="T20">T20 (20 Overs)</option>
                                <option value="T10">T10 (10 Overs)</option>
                                <option value="TEST">Test/Days</option>
                                <option value="CUSTOM">Custom/Freelance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Proposed Date</label>
                            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Location / Ground</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none" placeholder="e.g. Shivaji Park, Ground B" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider dark:text-gray-300">Message Details</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none text-sm resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Tell opponents about entry fees, skill level needed, or ball types..."></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider dark:text-gray-300">Contact Info</label>
                        <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Email or Phone number" />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Cancel</button>
                    <button onClick={handlePostChallenge} className="flex-1 py-3 bg-accent text-white font-black rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition-colors dark:shadow-none">Confirm Post</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
