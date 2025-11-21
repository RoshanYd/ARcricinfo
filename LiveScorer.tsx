import React, { useState, useEffect } from 'react';
import { Match, MatchStatus, ExtraType, DismissalType } from '../types';
import { Activity, AlertCircle, Check, X } from 'lucide-react';

interface ScorerProps {
  match: Match;
  onScoreUpdate: (runs: number, extra: ExtraType, dismissal: DismissalType) => void;
  onMatchEnd: () => void;
  onPause: () => void;
}

export const LiveScorer: React.FC<ScorerProps> = ({ match, onScoreUpdate, onMatchEnd, onPause }) => {
  const [isWicketModalOpen, setWicketModalOpen] = useState(false);
  const [isExtraModalOpen, setExtraModalOpen] = useState(false);
  const [selectedDismissal, setSelectedDismissal] = useState<DismissalType>(DismissalType.CAUGHT);
  
  const handleRunClick = (runs: number) => {
    onScoreUpdate(runs, ExtraType.NONE, DismissalType.NONE);
  };

  const handleWicketSubmit = () => {
    onScoreUpdate(0, ExtraType.NONE, selectedDismissal);
    setWicketModalOpen(false);
  };

  const handleExtraClick = (type: ExtraType) => {
    // Simple implementation: Wide/No Ball adds 1 run + ball is rebowled (logic handled in parent)
    // Byes/Leg Byes count as balls faced but not runs to bat
    onScoreUpdate(0, type, DismissalType.NONE);
    setExtraModalOpen(false);
  };

  if (match.status === MatchStatus.COMPLETED) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-accent mb-2">Match Completed</h2>
            <p className="text-gray-600 mb-4">Check the history tab for details.</p>
        </div>
      )
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-secondary/30 sticky bottom-0 md:relative">
      <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4">
        {[0, 1, 2, 3, 4, 5, 6].map(runs => (
          <button
            key={runs}
            onClick={() => handleRunClick(runs)}
            className={`h-14 rounded-lg text-xl font-bold transition-all active:scale-95 shadow-sm
              ${runs === 4 ? 'bg-success text-white' : 
                runs === 6 ? 'bg-purple-600 text-white' : 
                'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            {runs}
          </button>
        ))}
        
        <button
          onClick={() => setWicketModalOpen(true)}
          className="h-14 rounded-lg text-xl font-bold bg-highlight text-white hover:bg-red-700 active:scale-95 shadow-sm flex items-center justify-center"
        >
          OUT
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex gap-2">
            <button 
                onClick={() => onScoreUpdate(1, ExtraType.WIDE, DismissalType.NONE)}
                className="flex-1 py-3 bg-yellow-100 text-yellow-800 font-bold rounded-lg hover:bg-yellow-200"
            >
                WD
            </button>
            <button 
                onClick={() => onScoreUpdate(1, ExtraType.NO_BALL, DismissalType.NONE)}
                className="flex-1 py-3 bg-yellow-100 text-yellow-800 font-bold rounded-lg hover:bg-yellow-200"
            >
                NB
            </button>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => onScoreUpdate(1, ExtraType.BYE, DismissalType.NONE)} // simplified 1 run bye
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 text-sm"
            >
                Bye
            </button>
            <button 
                onClick={() => onScoreUpdate(1, ExtraType.LEG_BYE, DismissalType.NONE)} // simplified 1 run lb
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 text-sm"
            >
                LB
            </button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <button onClick={onPause} className="text-sm text-gray-500 hover:text-accent underline">
            Pause / Save for Later
        </button>
        <button 
            onClick={() => { if(confirm("End Match?")) onMatchEnd() }}
            className="text-sm text-highlight font-medium hover:underline"
        >
            End Match Early
        </button>
      </div>

      {/* Wicket Modal Overlay */}
      {isWicketModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-scale-up">
                <h3 className="text-xl font-bold text-accent mb-4">Dismissal Type</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                    {Object.values(DismissalType).filter(t => t !== DismissalType.NONE).map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedDismissal(type)}
                            className={`p-3 rounded text-sm font-medium border ${selectedDismissal === type ? 'bg-highlight text-white border-highlight' : 'bg-white text-gray-600'}`}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setWicketModalOpen(false)} className="flex-1 py-2 text-gray-600 border rounded-lg">Cancel</button>
                    <button onClick={handleWicketSubmit} className="flex-1 py-2 bg-highlight text-white rounded-lg font-bold">Confirm Wicket</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};