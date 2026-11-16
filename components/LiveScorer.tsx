import React, { useState } from 'react';
import { Match, MatchStatus, ExtraType, DismissalType, Player } from '../types';
import { RotateCcw, User } from 'lucide-react';

interface ScorerProps {
  match: Match;
  onScoreUpdate: (runs: number, extra: ExtraType, dismissal: DismissalType, fielderId?: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onMatchEnd: () => void;
  onPause: () => void;
}

export const LiveScorer: React.FC<ScorerProps> = ({ match, onScoreUpdate, onUndo, canUndo, onMatchEnd, onPause }) => {
  const [isWicketModalOpen, setWicketModalOpen] = useState(false);
  const [extraModalType, setExtraModalType] = useState<ExtraType | null>(null);
  const [selectedDismissal, setSelectedDismissal] = useState<DismissalType>(DismissalType.CAUGHT);
  const [isFielderModalOpen, setFielderModalOpen] = useState(false);

  const handleRunClick = (runs: number) => {
    onScoreUpdate(runs, ExtraType.NONE, DismissalType.NONE);
  };

  const handleWicketSubmit = () => {
    setWicketModalOpen(false);
    // Ask for fielder on CAUGHT or STUMPED
    if (selectedDismissal === DismissalType.CAUGHT || selectedDismissal === DismissalType.STUMPED) {
      setFielderModalOpen(true);
    } else {
      onScoreUpdate(0, ExtraType.NONE, selectedDismissal);
    }
  };

  const handleFielderSelect = (fielderId?: string) => {
    setFielderModalOpen(false);
    onScoreUpdate(0, ExtraType.NONE, selectedDismissal, fielderId);
  };

  const handleExtraClick = (type: ExtraType) => {
    setExtraModalType(type);
  };

  const handleExtraRunSelect = (runs: number) => {
    if (extraModalType) {
      onScoreUpdate(runs, extraModalType, DismissalType.NONE);
      setExtraModalType(null);
    }
  };

  // Fielding team = opposite of batting team
  const battingTeam = match.teamA.isBatting ? match.teamA : match.teamB;
  const fieldingTeam = match.teamA.isBatting ? match.teamB : match.teamA;

  if (match.status === MatchStatus.COMPLETED) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-accent mb-2">Match Completed</h2>
        <p className="text-gray-600 mb-4">Check the history tab for details.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-secondary/30 sticky bottom-0 md:relative z-20">
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
          <button onClick={() => handleExtraClick(ExtraType.WIDE)}
            className="flex-1 py-3 bg-yellow-100 text-yellow-800 font-bold rounded-lg hover:bg-yellow-200">WD</button>
          <button onClick={() => handleExtraClick(ExtraType.NO_BALL)}
            className="flex-1 py-3 bg-yellow-100 text-yellow-800 font-bold rounded-lg hover:bg-yellow-200">NB</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExtraClick(ExtraType.BYE)}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 text-sm">Bye</button>
          <button onClick={() => handleExtraClick(ExtraType.LEG_BYE)}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 text-sm">LB</button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onUndo} disabled={!canUndo}
            className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-md transition-colors ${canUndo ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}>
            <RotateCcw className="w-4 h-4" /> Undo
          </button>
          <button onClick={onPause} className="text-sm text-gray-500 hover:text-accent underline">Save / Pause</button>
        </div>
        <button onClick={onMatchEnd}
          className="text-sm text-highlight font-medium hover:underline">End Match</button>
      </div>

      {/* ── Wicket / Dismissal Modal ── */}
      {isWicketModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-up overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="bg-accent px-6 py-4">
              <h3 className="text-xl font-black text-white">How was the dismissal?</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-2 mb-5">
                {Object.values(DismissalType).filter(t => t !== DismissalType.NONE).map(type => (
                  <button key={type} onClick={() => setSelectedDismissal(type)}
                    className={`p-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      selectedDismissal === type
                        ? 'bg-accent text-white border-accent shadow-md'
                        : 'bg-white dark:bg-slate-800/60 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-accent hover:bg-accent/15'
                    }`}>
                    {type === DismissalType.CAUGHT ? '🤲 Caught' :
                     type === DismissalType.BOWLED ? '🎳 Bowled' :
                     type === DismissalType.RUN_OUT ? '🎯 Run Out' :
                     type === DismissalType.LBW ? '🦵 LBW' :
                     type === DismissalType.STUMPED ? '🧤 Stumped' :
                     type === DismissalType.HIT_WICKET ? '💥 Hit Wicket' :
                     type.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setWicketModalOpen(false)}
                  className="flex-1 py-3 border-2 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={handleWicketSubmit}
                  className="flex-1 py-3 bg-accent text-white rounded-xl font-black shadow-md hover:opacity-95 transition-opacity">
                  {selectedDismissal === DismissalType.CAUGHT || selectedDismissal === DismissalType.STUMPED
                    ? 'Next →'
                    : 'Confirm OUT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fielder Picker Modal (Caught / Stumped) ── */}
      {isFielderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-up overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="bg-accent px-6 py-4">
              <h3 className="text-lg font-black text-white">
                {selectedDismissal === DismissalType.CAUGHT ? '🤲 Who took the catch?' : '🧤 Who stumped?'}
              </h3>
              <p className="text-white/80 text-xs mt-0.5">Tap the fielder's name</p>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {fieldingTeam.players.map(p => (
                  <button key={p.id} onClick={() => handleFielderSelect(p.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-accent hover:bg-accent/15 active:bg-accent/25 transition-all text-left group w-full">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-accent transition-colors">{p.name}</span>
                    {p.isCaptain && <span className="ml-auto text-amber-500 font-black text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">C</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => handleFielderSelect(undefined)}
                className="w-full py-2.5 border-2 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                Skip (unknown fielder)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extras Modal ── */}
      {extraModalType && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-up overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="bg-accent px-6 py-4">
              <h3 className="text-xl font-black text-white">
                {extraModalType === ExtraType.WIDE && "Wide Ball + Runs"}
                {extraModalType === ExtraType.NO_BALL && "No Ball + Runs"}
                {extraModalType === ExtraType.BYE && "Byes"}
                {extraModalType === ExtraType.LEG_BYE && "Leg Byes"}
              </h3>
              <p className="text-white/80 text-xs mt-0.5">Select additional runs scored.</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[0, 1, 2, 3, 4, 5, 6].map(r => (
                  <button key={r} onClick={() => handleExtraRunSelect(r)}
                    className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-accent hover:bg-accent/20 text-gray-800 dark:text-white font-black text-lg transition-colors">
                    +{r}
                  </button>
                ))}
              </div>
              <button onClick={() => setExtraModalType(null)}
                className="w-full py-3 border-2 border-gray-200 dark:border-white/10 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};