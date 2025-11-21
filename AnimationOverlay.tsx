import React, { useEffect } from 'react';
import { AnimationEvent } from '../types';

interface Props {
  event: AnimationEvent;
  onComplete: () => void;
}

export const AnimationOverlay: React.FC<Props> = ({ event, onComplete }) => {
  useEffect(() => {
    if (event.type !== 'NONE') {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [event, onComplete]);

  if (event.type === 'NONE') return null;

  let bgColor = 'bg-black/80';
  let textColor = 'text-white';
  let mainText = '';
  let subText = event.message;
  let animClass = '';

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
      break;
    case 'INNINGS_BREAK':
      bgColor = 'bg-blue-700/95';
      mainText = 'INNINGS END';
      // subText will be target info
      animClass = 'animate-scale-up';
      break;
  }

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${bgColor} transition-all duration-300 backdrop-blur-sm p-4 overflow-hidden`}>
      <div className={`text-6xl md:text-9xl font-black ${textColor} ${animClass} drop-shadow-lg text-center break-words max-w-full`}>
        {mainText}
      </div>
      <div className="text-xl md:text-3xl font-bold text-white mt-4 md:mt-8 uppercase tracking-widest animate-pulse text-center px-4 max-w-full break-words">
        {subText}
      </div>
      {/* Basic Confetti CSS particles for win/six */}
      {(event.type === 'WIN' || event.type === 'SIX') && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                  <div key={i} 
                       className="absolute w-3 h-3 bg-white rounded-full opacity-50"
                       style={{
                           left: `${Math.random() * 100}%`,
                           top: `-10px`,
                           animation: `fall ${1 + Math.random() * 2}s linear infinite`
                       }}
                  />
              ))}
              <style>{`
                @keyframes fall {
                    to { transform: translateY(100vh) rotate(360deg); }
                }
              `}</style>
          </div>
      )}
    </div>
  );
};