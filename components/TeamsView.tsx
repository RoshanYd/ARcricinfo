import React, { useState } from 'react';
import { PersistentTeam } from '../types';
import { Users, Plus, Trash2, Edit2, Check, X, Shield, Link } from 'lucide-react';

interface TeamsViewProps {
  teams: PersistentTeam[];
  isLoading: boolean;
  onSaveTeam: (team: PersistentTeam) => void;
  onDeleteTeam: (teamId: string) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({ teams, isLoading, onSaveTeam, onDeleteTeam }) => {
  const [editingTeam, setEditingTeam] = useState<PersistentTeam | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [roster, setRoster] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingTeam(null);
    setName('');
    setLogoUrl('');
    setRoster([]);
    setNewPlayerName('');
  };

  const handleStartEdit = (team: PersistentTeam) => {
    setIsCreating(false);
    setEditingTeam(team);
    setName(team.name);
    setLogoUrl(team.logoUrl || '');
    setRoster([...team.roster]);
    setNewPlayerName('');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTeam(null);
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && !roster.includes(newPlayerName.trim())) {
      setRoster([...roster, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const handleRemovePlayer = (player: string) => {
    setRoster(roster.filter(p => p !== player));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Team name is required');
      return;
    }
    
    const teamToSave: PersistentTeam = {
      id: editingTeam ? editingTeam.id : crypto.randomUUID(),
      name: name.trim(),
      logoUrl: logoUrl.trim() || undefined,
      roster: roster
    };

    onSaveTeam(teamToSave);
    handleCancel();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-accent flex items-center gap-3">
            <Shield className="w-8 h-8" /> Team Manager
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage your permanent teams and rosters</p>
        </div>
        {!isCreating && !editingTeam && (
          <button onClick={handleStartCreate} className="px-5 py-2.5 bg-accent text-white font-bold rounded-xl flex items-center gap-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
            <Plus className="w-5 h-5" /> New Team
          </button>
        )}
      </div>

      {(isCreating || editingTeam) ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-black text-gray-800">{isCreating ? 'Create New Team' : 'Edit Team'}</h3>
            <button onClick={handleCancel} className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Team Name</label>
                <input
                  autoFocus
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Mumbai Indians"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent font-bold text-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1 uppercase tracking-wider"><Link className="w-3.5 h-3.5" /> Logo URL (Optional)</label>
                <input
                  value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-accent text-gray-700 text-sm transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-4">
               {logoUrl ? (
                 <img src={logoUrl} alt="Team Logo Preview" className="max-h-32 object-contain" onError={e => e.currentTarget.src = ''} />
               ) : (
                 <div className="text-center text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">Logo Preview</p>
                 </div>
               )}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-3">Team Roster ({roster.length} Players)</label>
            <div className="flex gap-2 mb-4">
              <input
                value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                placeholder="Enter player name..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent focus:bg-white text-sm font-semibold transition-colors"
              />
              <button onClick={handleAddPlayer} disabled={!newPlayerName.trim()} className="px-4 py-2.5 bg-gray-800 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-black transition-colors">
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
              {roster.length === 0 ? (
                <p className="text-sm text-gray-400 font-medium p-2 italic">No players added yet.</p>
              ) : (
                roster.map(p => (
                  <div key={p} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-sm font-bold text-gray-700">{p}</span>
                    <button onClick={() => handleRemovePlayer(p)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={handleCancel} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-8 py-3 bg-accent text-white font-black rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all">Save Team</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">No Teams Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create and save your regular playing teams so you don't have to enter squads manually every match.</p>
              <button onClick={handleStartCreate} className="px-6 py-3 bg-accent text-white font-bold rounded-xl inline-flex items-center gap-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                <Plus className="w-5 h-5" /> Create First Team
              </button>
            </div>
          ) : (
            teams.map(team => (
              <div key={team.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-24 bg-gray-100 relative flex items-center justify-center border-b border-gray-100">
                   {team.logoUrl ? (
                     <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover opacity-80" onError={e => e.currentTarget.style.display = 'none'} />
                   ) : (
                     <Shield className="w-12 h-12 text-gray-300" />
                   )}
                   <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                   <h3 className="absolute bottom-2 left-4 right-4 font-black text-white text-lg truncate drop-shadow-md">{team.name}</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5">
                       <Users className="w-3.5 h-3.5" /> {team.roster.length} Players
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleStartEdit(team)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if(confirm('Are you sure you want to delete this team?')) onDeleteTeam(team.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {team.roster.slice(0, 5).map(p => (
                      <span key={p} className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-[80px]">
                        {p}
                      </span>
                    ))}
                    {team.roster.length > 5 && (
                      <span className="text-[10px] font-bold text-gray-400 px-1.5 py-0.5">+{team.roster.length - 5} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
