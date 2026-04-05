import React, { useState } from 'react';
import { Target, Search, MessageSquarePlus, MapPin, Calendar, Users, Activity, Crown } from 'lucide-react';
import { format } from 'date-fns';

export interface ChallengePost {
  id: string;
  teamName: string;
  location: string;
  date: Date;
  matchType: 'T20' | 'T10' | 'TEST' | 'CUSTOM';
  message: string;
  contactInfo: string;
  postedAt: Date;
  status: 'OPEN' | 'ACCEPTED';
}

const mockPosts: ChallengePost[] = [
  {
    id: '1',
    teamName: 'Mumbai Mavericks',
    location: 'Shivaji Park, Mumbai',
    date: new Date(Date.now() + 86400000 * 2), // 2 days from now
    matchType: 'T20',
    message: 'Looking for a competitive Division A team for a friendly match this weekend. We provide the leather balls.',
    contactInfo: 'mumbai.mavs@example.com',
    postedAt: new Date(Date.now() - 3600000 * 5),
    status: 'OPEN'
  },
  {
    id: '2',
    teamName: 'Delhi Capitals Local',
    location: 'Feroz Shah Kotla Grounds (Outer)',
    date: new Date(Date.now() + 86400000 * 5),
    matchType: 'T10',
    message: 'Short format 10-over blast. Looking for opponents to practice big hitting. Entry fee split 50/50 for ground rental.',
    contactInfo: 'delhi.caps.local@example.com',
    postedAt: new Date(Date.now() - 86400000 * 1),
    status: 'OPEN'
  },
  {
    id: '3',
    teamName: 'Bengaluru Blasters',
    location: 'Chinnaswamy Nets',
    date: new Date(Date.now() + 86400000 * 1),
    matchType: 'CUSTOM',
    message: 'Need 2 freelance fast bowlers for a corporate tournament tomorrow! DM urgent.',
    contactInfo: 'freelance.blr@example.com',
    postedAt: new Date(Date.now() - 3600000 * 12),
    status: 'ACCEPTED'
  }
];

export const CommunityBoard: React.FC = () => {
  const [posts, setPosts] = useState<ChallengePost[]>(mockPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'T20' | 'T10' | 'CUSTOM'>('ALL');

  // Form state
  const [teamName, setTeamName] = useState('');
  const [location, setLocation] = useState('');
  const [matchType, setMatchType] = useState<'T20' | 'T10' | 'TEST' | 'CUSTOM'>('T20');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const handlePostChallenge = () => {
    if (!teamName || !location || !date || !message) return;

    const newPost: ChallengePost = {
      id: Math.random().toString(36).substr(2, 9),
      teamName,
      location,
      date: new Date(date),
      matchType,
      message,
      contactInfo,
      postedAt: new Date(),
      status: 'OPEN'
    };

    setPosts([newPost, ...posts]);
    setIsModalOpen(false);
    
    // Reset Form
    setTeamName('');
    setLocation('');
    setMessage('');
    setContactInfo('');
  };

  const filteredPosts = filterType === 'ALL' ? posts : posts.filter(p => p.matchType === filterType);

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
                         <span className="text-xs text-gray-400 font-medium">Posted {format(post.postedAt, 'MMM d')}</span>
                         {post.status === 'OPEN' && (
                            <a href={`mailto:${post.contactInfo}`} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-accent text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95">
                                Connect / Accept
                            </a>
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
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Message Details</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none text-sm resize-none" placeholder="Tell opponents about entry fees, skill level needed, or ball types..."></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Contact Info</label>
                        <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-accent font-semibold outline-none" placeholder="Email or Phone number" />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={handlePostChallenge} className="flex-1 py-3 bg-accent text-white font-black rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition-colors">Confirm Post</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
