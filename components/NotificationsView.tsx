import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { loadNotifications, markNotificationRead } from '../utils/db';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';

export interface NotificationsViewProps {
    userProfile: { id: string; name: string } | null;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ userProfile }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifs() {
            if (userProfile) {
                const data = await loadNotifications(userProfile.id);
                setNotifications(data);
            }
            setIsLoading(false);
        }
        fetchNotifs();
    }, [userProfile]);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-accent">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold">Loading inbox...</p>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                <ShieldAlert className="w-12 h-12 mb-4 text-gray-300" />
                <p className="font-bold text-lg">Must be logged in to view notifications.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-accent flex items-center gap-3">
                    <Bell className="w-8 h-8" /> New Updates
                </h2>
                <p className="text-gray-500 text-sm mt-1">Challenge acceptances and system messages.</p>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400">No New Notifications</h3>
                        <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className={`p-5 rounded-2xl border transition-all ${n.isRead ? 'bg-white border-gray-100 opacity-70 dark:bg-slate-800 dark:border-slate-700' : 'bg-blue-50 border-blue-200 shadow-md dark:bg-slate-800/80 dark:border-indigo-500'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-blue-500 animate-pulse'}`} />
                                    <div>
                                        <p className={`text-sm md:text-base font-semibold ${n.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-xs text-gray-400 font-medium mt-1">
                                            {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <button 
                                        onClick={() => handleMarkAsRead(n.id)}
                                        className="text-xs font-bold bg-white text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300"
                                    >
                                        Mark Read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
