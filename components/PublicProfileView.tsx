import React, { useEffect, useState } from 'react';
import { DBPlayer } from '../utils/db';
import { Match } from '../types';
import { PlayerProfileView } from './PlayerProfileView';
import { Loader2, AlertCircle, Share2, Home } from 'lucide-react';
import { useToast } from './Toast';

export const PublicProfileView: React.FC<{ playerId: string }> = ({ playerId }) => {
    const [player, setPlayer] = useState<DBPlayer | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const toast = useToast();

    useEffect(() => {
        const fetchPublicProfile = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/public/player/${playerId}`);
                if (!res.ok) throw new Error('Player not found or profile is private.');
                const data = await res.json();
                setPlayer(data.player);
                setMatches(data.matches);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicProfile();
    }, [playerId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                <p className="text-gray-500 font-bold">Loading Global Profile...</p>
            </div>
        );
    }

    if (error || !player) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-lg text-center border border-gray-100">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-gray-800 mb-2">Profile Unavailable</h2>
                    <p className="text-gray-500 text-sm mb-6">{error || 'This player profile does not exist.'}</p>
                    <button onClick={() => window.location.href = '/'} className="w-full py-3 bg-accent text-white font-bold rounded-xl shadow-md hover:bg-accent/90 transition-colors">
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${player.name}'s Cricket Profile`,
                    text: `Check out ${player.name}'s cricket stats on ARcricinfo!`,
                    url: url,
                });
            } catch (err) {
                console.log('Share failed', err);
            }
        } else {
            await navigator.clipboard.writeText(url);
            toast('Profile link copied to clipboard!', 'success');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Custom Public Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
                <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-gray-600 hover:text-accent font-bold">
                    <Home className="w-5 h-5" /> ARcricinfo
                </button>
                <button onClick={handleShare} className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full font-bold hover:bg-accent/20 transition-colors">
                    <Share2 className="w-4 h-4" /> Share
                </button>
            </div>
            
            {/* Render Existing Profile View */}
            <PlayerProfileView
                player={player}
                allPlayers={[player]} // Only pass self to disable H2H basically
                allMatches={matches}
                onBack={() => window.location.href = '/'}
                onMatchClick={() => {
                    toast('Match details are only available in the app', 'info');
                }}
            />
        </div>
    );
};
