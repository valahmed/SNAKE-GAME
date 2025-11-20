
import React from 'react';
import { GameStatus } from '../types';
import { Sparkles, Play, RotateCcw, Settings, LogOut } from 'lucide-react';
import { SLIDER_MIN_DELAY, SLIDER_MAX_DELAY } from '../constants';

interface GameOverlayProps {
  status: GameStatus;
  score: number;
  initialSpeed: number;
  setInitialSpeed: (speed: number) => void;
  onStart: () => void;
  onRestart: () => void;
  onExit: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ 
  status, 
  score, 
  initialSpeed,
  setInitialSpeed,
  onStart, 
  onRestart, 
  onExit
}) => {
  if (status === GameStatus.PLAYING) return null;

  const isGameOver = status === GameStatus.GAME_OVER;

  // Calculate display percentage for speed (inverse logic because lower delay = faster)
  const speedPercent = Math.round(((SLIDER_MAX_DELAY - initialSpeed) / (SLIDER_MAX_DELAY - SLIDER_MIN_DELAY)) * 100);

  const renderSpeedControl = () => (
    <div className="w-full mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between text-sm font-mono text-neon-blue mb-2">
        <span className="flex items-center gap-2"><Settings size={14} /> GAME SPEED</span>
        <span>{speedPercent}% MAX</span>
      </div>
      <input
        type="range"
        min={SLIDER_MIN_DELAY}
        max={SLIDER_MAX_DELAY}
        step={10}
        value={initialSpeed}
        onChange={(e) => setInitialSpeed(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
        style={{ direction: 'rtl' }} // Right is faster (lower delay), Left is slower
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
        <span>FAST</span>
        <span>SLOW</span>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all">
      <div className="max-w-md w-full p-8 border-2 border-neon-blue rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] bg-gray-900/90 text-center relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]"></div>

        {isGameOver ? (
          <>
            <h2 className="text-5xl font-black text-neon-pink mb-2 tracking-tighter animate-pulse drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]">
              GAME OVER
            </h2>
            <p className="text-xl text-neon-green font-mono mb-8">FINAL SCORE: {score}</p>
            
            {renderSpeedControl()}

            <div className="flex flex-col gap-4">
              <button 
                onClick={onRestart}
                className="group relative px-8 py-3 bg-transparent border border-neon-green text-neon-green font-bold text-lg tracking-widest hover:bg-neon-green hover:text-black transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw className="w-5 h-5" /> PLAY AGAIN
                </span>
              </button>

              <button 
                onClick={onExit}
                className="group relative px-8 py-3 bg-transparent border border-neon-pink text-neon-pink font-bold text-lg tracking-widest hover:bg-neon-pink hover:text-black transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <LogOut className="w-5 h-5" /> EXIT GAME
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Sparkles className="w-16 h-16 mx-auto text-neon-blue animate-pulse" />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              GAME DEVELOP BY AHMED
            </h1>
            <p className="text-gray-400 font-mono mb-6 text-sm">
              AI-ENHANCED // REACT // TAILWIND
            </p>
            
            {renderSpeedControl()}

            <button 
              onClick={onStart}
              className="w-full px-8 py-4 bg-neon-blue text-black font-black text-xl tracking-widest hover:shadow-[0_0_20px_#00ffff] transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <Play className="w-6 h-6 fill-current" /> START GAME
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameOverlay;
