import React, { useState, useEffect, useRef } from 'react';
import { DBPlayer } from '../utils/db';

interface PlayerAutosuggestInputProps {
    value: string;
    onChange: (val: string) => void;
    dbPlayers?: DBPlayer[];
    placeholder?: string;
    className?: string;
}

export const PlayerAutosuggestInput: React.FC<PlayerAutosuggestInputProps> = ({ value, onChange, dbPlayers = [], placeholder, className }) => {
    const [suggestions, setSuggestions] = useState<DBPlayer[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (val.trim().length > 1) {
            const filtered = dbPlayers.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
            // only show top 10 matches
            setSuggestions(filtered.slice(0, 10));
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (player: DBPlayer) => {
        onChange(player.name);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                className={className}
                placeholder={placeholder}
                onFocus={() => { if (value.trim().length > 1 && suggestions.length > 0) setIsOpen(true); }}
            />
            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                    {suggestions.map(p => {
                        const dismissals = Math.max(1, p.innings_batted - p.not_outs);
                        const avg = (p.total_runs / dismissals).toFixed(1);
                        return (
                        <li 
                            key={p.id}
                            onClick={() => handleSelect(p)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors"
                        >
                            <span className="font-bold text-gray-800">{p.name}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded shadow-inner">
                                {p.matches_played} Matches · Avg {avg}
                            </span>
                        </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
