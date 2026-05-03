import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Match } from '../types';
import { Download, Share2, Trophy, Tv, Check } from 'lucide-react';

interface ShareScorecardProps {
  match: Match;
}

export const ShareScorecard: React.FC<ShareScorecardProps> = ({ match }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copiedObs, setCopiedObs] = useState(false);

  const handleCopyBroadcastURL = () => {
      const url = `${window.location.origin}/?live=${match.id}&broadcast=true`;
      navigator.clipboard.writeText(url);
      setCopiedObs(true);
      setTimeout(() => setCopiedObs(false), 2000);
  };

  const winner = match.winningTeamId
    ? (match.winningTeamId === match.teamA.id ? match.teamA : match.teamB)
    : null;
  const loser = match.winningTeamId
    ? (match.winningTeamId === match.teamA.id ? match.teamB : match.teamA)
    : null;

  const formatScore = (team: typeof match.teamA) =>
    `${team.totalRuns}/${team.wickets} (${Math.floor(team.overs / 6)}.${team.overs % 6})`;

  const handleCapture = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
    const dataUrl = canvas.toDataURL('image/png');
    
    // Try native Share API first (mobile)
    if (navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'scorecard.png', { type: 'image/png' });
        await navigator.share({
          title: `${match.teamA.name} vs ${match.teamB.name} — ARcricinfo`,
          files: [file],
        });
        return;
      } catch (_) { /* fallback to download */ }
    }

    // Fallback: download
    const link = document.createElement('a');
    link.download = `${match.teamA.name}_vs_${match.teamB.name}_scorecard.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#1e1b4b', // Provide background for rounded corners
      scale: 2,
      useCORS: true,
    });
    const dataUrl = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const yPos = (pageHeight - pdfHeight) / 2;
    
    pdf.addImage(dataUrl, 'PNG', 0, yPos > 0 ? yPos : 0, pdfWidth, pdfHeight);
    pdf.save(`${match.teamA.name}_vs_${match.teamB.name}_scorecard.pdf`);
  };

  const motm = match.manOfTheMatchId
    ? [...match.teamA.players, ...match.teamB.players].find(p => p.id === match.manOfTheMatchId)
    : null;

  return (
    <div className="space-y-4">
      {/* ── Shareable Card ── */}
      <div ref={cardRef} className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="https://i.postimg.cc/fRdWdn9t/20251127-224320.png" className="w-8 h-8 rounded-full" alt="ARcricinfo" />
            <span className="text-white/60 font-bold text-xs tracking-widest uppercase">ARcricinfo</span>
          </div>
          <div className="text-white/40 text-xs font-semibold">
            {new Date(match.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Scores */}
        <div className="px-6 py-4 flex items-center justify-center gap-6">
          <div className="text-center flex-1">
            <h3 className={`font-black text-lg mb-1 ${match.winningTeamId === match.teamA.id ? 'text-yellow-300' : 'text-white'}`}>
              {match.teamA.name}
            </h3>
            <p className="text-white font-black text-2xl">{formatScore(match.teamA)}</p>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full">
            <span className="text-white/70 text-xs font-bold">VS</span>
          </div>
          <div className="text-center flex-1">
            <h3 className={`font-black text-lg mb-1 ${match.winningTeamId === match.teamB.id ? 'text-yellow-300' : 'text-white'}`}>
              {match.teamB.name}
            </h3>
            <p className="text-white font-black text-2xl">{formatScore(match.teamB)}</p>
          </div>
        </div>

        {/* Result + MOTM */}
        <div className="px-6 pb-6 text-center space-y-3">
          {winner && loser && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-2.5">
              <p className="text-yellow-300 font-black text-sm flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4" />
                {winner.name} won by {
                  winner.id === (match.battingFirstId === match.teamA.id ? match.teamB.id : match.teamA.id)
                    ? `${match.totalOvers * 6 - loser.overs > 0 ? '' : ''}${winner.totalRuns - loser.totalRuns} runs`
                    : `${loser.players.filter(p => !p.isOut).length} wickets`
                }
              </p>
            </div>
          )}
          {motm && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/40 text-xs font-bold">MOTM:</span>
              <span className="text-white font-bold text-sm">{motm.name}</span>
              <span className="text-white/40 text-xs">{motm.runs}r · {motm.wickets}w</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Share Buttons ── */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
            <button onClick={handleCapture}
            className="flex-1 py-3 bg-accent text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-accent/90 transition-colors">
            {navigator.share ? <><Share2 className="w-4 h-4" /> Share Image</> : <><Download className="w-4 h-4" /> Save Image</>}
            </button>
            <button onClick={handleDownloadPDF}
            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-red-700 transition-colors">
            <Download className="w-4 h-4" /> Save PDF
            </button>
        </div>
        <button onClick={handleCopyBroadcastURL}
          className="w-full py-3 bg-indigo-900 border border-indigo-700 text-indigo-100 font-bold rounded-xl flex items-center justify-center gap-2 shadow-inner hover:bg-indigo-800 transition-colors">
          {copiedObs ? <><Check className="w-4 h-4 text-green-400" /> Copied OBS URL!</> : <><Tv className="w-4 h-4" /> Copy OBS Broadcast URL</>}
        </button>
      </div>
    </div>
  );
};
