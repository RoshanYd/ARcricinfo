
import React, { useEffect } from 'react';
import { AnimationEvent } from '../types';
import { Trophy, Star, User } from 'lucide-react';

interface Props {
  event: AnimationEvent;
  onComplete: () => void;
}

export const AnimationOverlay: React.FC<Props> = ({ event, onComplete }) => {
  useEffect(() => {
    if (event.type !== 'NONE') {
      // Longer duration for WIN and MOTM to let the user enjoy the animation
      const duration = (event.type === 'WIN' || event.type === 'MOTM') ? 4000 : 2500;
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [event, onComplete]);

  if (event.type === 'NONE') return null;

  let bgColor = 'bg-black/80';
  let textColor = 'text-white';
  let mainText = '';
  let subText = event.message;
  let animClass = '';
  let Icon = null;

  switch (event.type) {
    case 'FOUR':
      bgColor = 'bg-green-600/90';
      mainText = '4';
      subText = 'BOUNDARY!';
      animClass = 'animate-bounce-slow';
      break;
    case 'SIX':
      bgColor = 'bg-purple-600/90';
      mainText = '6';
      subText = 'MAXIMUM!';
      animClass = 'animate-ping-slow';
      break;
    case 'WICKET':
      bgColor = 'bg-red-600/90';
      mainText = 'W';
      subText = 'OUT!';
      animClass = 'animate-scale-up';
      break;
    case 'WIN':
      bgColor = 'bg-yellow-500/95';
      mainText = 'WINNER';
      // subText handles team name
      animClass = 'animate-bounce';
      Icon = Trophy;
      break;
    case 'INNINGS_BREAK':
      bgColor = 'bg-blue-700/95';
      mainText = 'INNINGS END';
      // subText will be target info
      animClass = 'animate-scale-up';
      break;
    case 'MOTM':
      bgColor = 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 opacity-95';
      mainText = 'MAN OF THE MATCH';
      subText = event.message; // Player Name
      animClass = 'animate-scale-up';
      Icon = Star;
      break;
  }

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${bgColor} transition-all duration-300 backdrop-blur-sm p-4 overflow-hidden`}>
      
      {/* MOTM Special Layout */}
      {event.type === 'MOTM' ? (
        <div className="flex flex-col items-center animate-scale-up">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-yellow-400 p-1 bg-white relative z-10 overflow-hidden shadow-2xl">
                     {event.player?.avatar ? (
                         <img src={event.player.avatar} alt="Player" className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                             <User className="w-20 h-20" />
                         </div>
                     )}
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
                     <Star className="w-12 h-12 text-yellow-400 fill-current drop-shadow-md animate-bounce" />
                </div>
            </div>
            
            <h2 className="text-yellow-400 font-black text-3xl md:text-5xl tracking-widest uppercase mb-2 drop-shadow-lg text-center">
                Man of the Match
            </h2>
            <h1 className="text-white font-bold text-4xl md:text-6xl text-center mb-4 drop-shadow-xl">
                {subText}
            </h1>
            <div className="px-6 py-2 bg-white/10 rounded-full border border-white/20 text-blue-200 font-medium tracking-wider">
                Outstanding Performance
            </div>
        </div>
      ) : (
        /* Standard Layout for other events */
        <>
            {Icon && <Icon className="w-20 h-20 text-white/90 mb-4 animate-bounce" />}
            <div className={`text-6xl md:text-9xl font-black ${textColor} ${animClass} drop-shadow-lg text-center break-words max-w-full`}>
                {mainText}
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mt-4 md:mt-8 uppercase tracking-widest animate-pulse text-center px-4 max-w-full break-words">
                {subText}
            </div>
        </>
      )}

      {/* Confetti particles for WIN/SIX/MOTM */}
      {(event.type === 'WIN' || event.type === 'SIX' || event.type === 'MOTM') && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                  <div key={i} 
                       className={`absolute w-3 h-3 rounded-full opacity-70 ${['bg-yellow-400', 'bg-white', 'bg-red-400', 'bg-blue-400'][Math.floor(Math.random()*4)]}`}
                       style={{
                           left: `${Math.random() * 100}%`,
                           top: `-20px`,
                           animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                           animationDelay: `${Math.random() * 2}s`
                       }}
                  />
              ))}
              <style>{`
                @keyframes fall {
                    to { transform: translateY(110vh) rotate(720deg); }
                }
              `}</style>
          </div>
      )}
    </div>
  );
};
