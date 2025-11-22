
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Coordinate, Direction, GameStatus, AICommentary } from './types';
import { KEYS, BOARD_WIDTH, BOARD_HEIGHT, GRID_SIZE, INITIAL_SPEED, MIN_SPEED, SPEED_DECREMENT } from './constants';
import { getFastCommentary } from './services/geminiService';
import { playSound } from './services/audioService';
import SnakeBoard from './components/SnakeBoard';
import GameOverlay from './components/GameOverlay';
import { MessageSquare, Zap, Cpu, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [snake, setSnake] = useState<Coordinate[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Coordinate>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [initialSpeed, setInitialSpeed] = useState(INITIAL_SPEED);
  
  // UI State
  const [boardScale, setBoardScale] = useState(1);
  
  // AI State
  const [commentary, setCommentary] = useState<AICommentary | null>(null);
  const [modelLoading, setModelLoading] = useState(false);

  // Refs for mutable state in game loop
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const lastProcessedDirectionRef = useRef<Direction>(Direction.RIGHT);
  const gameLoopRef = useRef<number | null>(null);
  const speedRef = useRef(INITIAL_SPEED);

  // Helper to generate random food not on snake
  const generateFood = useCallback((currentSnake: Coordinate[]): Coordinate => {
    let newFood: Coordinate;
    let isOnSnake = true;
    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * BOARD_WIDTH),
        y: Math.floor(Math.random() * BOARD_HEIGHT),
      };
      // eslint-disable-next-line no-loop-func
      isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) return newFood;
    }
    return { x: 0, y: 0 }; // Should not reach here
  }, []);

  // Handle Screen Resize for Responsive Board
  useEffect(() => {
    const handleResize = () => {
      const gameBoardSize = BOARD_WIDTH * GRID_SIZE; // 500px
      const paddingX = 32; // Safety margin
      const paddingY = 300; // Space for header and controls
      
      const availableWidth = window.innerWidth - paddingX;
      const availableHeight = window.innerHeight - paddingY;

      const scaleX = availableWidth / gameBoardSize;
      const scaleY = availableHeight / gameBoardSize;

      // Scale down if needed, but cap at 1 (don't upscale on huge screens)
      // Use the smaller scale to ensure it fits both dimensions
      const newScale = Math.min(1, scaleX, scaleY); 
      
      // Ensure it doesn't get absurdly small
      setBoardScale(Math.max(0.5, newScale));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calc

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Input Handler
  const changeDirection = useCallback((newDir: Direction) => {
    if (status !== GameStatus.PLAYING) return;
    
    const currentDir = lastProcessedDirectionRef.current;
    
    if (newDir === Direction.UP && currentDir !== Direction.DOWN) directionRef.current = Direction.UP;
    else if (newDir === Direction.DOWN && currentDir !== Direction.UP) directionRef.current = Direction.DOWN;
    else if (newDir === Direction.LEFT && currentDir !== Direction.RIGHT) directionRef.current = Direction.LEFT;
    else if (newDir === Direction.RIGHT && currentDir !== Direction.LEFT) directionRef.current = Direction.RIGHT;
  }, [status]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case KEYS.ARROW_UP:
        case KEYS.W:
          changeDirection(Direction.UP);
          break;
        case KEYS.ARROW_DOWN:
        case KEYS.S:
          changeDirection(Direction.DOWN);
          break;
        case KEYS.ARROW_LEFT:
        case KEYS.A:
          changeDirection(Direction.LEFT);
          break;
        case KEYS.ARROW_RIGHT:
        case KEYS.D:
          changeDirection(Direction.RIGHT);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Triggers Commentary
  const triggerCommentary = useCallback(async (type: 'eat' | 'die' | 'start', currentScore: number) => {
    setModelLoading(true);
    // Call Gemini Flash Lite
    const result = await getFastCommentary(currentScore, type);
    setCommentary(result);
    setModelLoading(false);

    // Clear commentary after 3 seconds
    setTimeout(() => setCommentary(null), 3000);
  }, []);

  const gameOver = useCallback(() => {
    setStatus(GameStatus.GAME_OVER);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    playSound('die');
    triggerCommentary('die', score);
    if (score > highScore) setHighScore(score);
  }, [score, highScore, triggerCommentary]);

  // Game Loop
  const moveSnake = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const nextHead = { ...head };
      
      // Update direction being processed
      const moveDir = directionRef.current;
      lastProcessedDirectionRef.current = moveDir;
      setDirection(moveDir); // Just for UI sync if needed

      switch (moveDir) {
        case Direction.UP: nextHead.y -= 1; break;
        case Direction.DOWN: nextHead.y += 1; break;
        case Direction.LEFT: nextHead.x -= 1; break;
        case Direction.RIGHT: nextHead.x += 1; break;
      }

      // Wall Collision
      if (
        nextHead.x < 0 || 
        nextHead.x >= BOARD_WIDTH || 
        nextHead.y < 0 || 
        nextHead.y >= BOARD_HEIGHT
      ) {
        gameOver();
        return prevSnake;
      }

      // Self Collision
      if (prevSnake.some(segment => segment.x === nextHead.x && segment.y === nextHead.y)) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [nextHead, ...prevSnake];

      // Eat Food
      if (nextHead.x === food.x && nextHead.y === food.y) {
        playSound('eat');
        const newScore = score + 1;
        setScore(newScore);
        setFood(generateFood(newSnake));
        
        // Increase speed (limit to MIN_SPEED)
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_DECREMENT);
        
        // Trigger AI commentary occasionally or on milestones
        if (newScore % 5 === 0) {
           triggerCommentary('eat', newScore);
        }
      } else {
        newSnake.pop(); // Remove tail
      }

      return newSnake;
    });
  }, [status, food, generateFood, score, gameOver, triggerCommentary]);

  // Interval Management
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = window.setInterval(moveSnake, speedRef.current);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [status, moveSnake]); 
  
  // React to score change (speed change) to update interval
  useEffect(() => {
    if (status === GameStatus.PLAYING && gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = window.setInterval(moveSnake, speedRef.current);
    }
  }, [score, status, moveSnake]);


  const handleStartGame = () => {
    playSound('start');
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection(Direction.RIGHT);
    directionRef.current = Direction.RIGHT;
    lastProcessedDirectionRef.current = Direction.RIGHT;
    setScore(0);
    setCommentary(null);
    speedRef.current = initialSpeed; // Use user defined speed
    setStatus(GameStatus.PLAYING);
    triggerCommentary('start', 0);
  };

  const handleExit = () => {
    setStatus(GameStatus.IDLE);
    setCommentary(null);
    setScore(0);
  };

  const gameSizePx = BOARD_WIDTH * GRID_SIZE;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-neon-green selection:text-black flex flex-col items-center justify-start md:justify-center relative overflow-hidden pt-4 pb-8 touch-none">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header / Scoreboard */}
      <div className="w-full max-w-2xl flex justify-between items-end mb-2 z-10 px-4 md:mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue drop-shadow-[0_2px_10px_rgba(57,255,20,0.3)]">
            GAME DEVELOP BY AHMED
          </h1>
          <div className="flex gap-4 text-xs md:text-sm font-mono mt-1 md:mt-2">
            <span className="text-gray-400">HIGH SCORE: <span className="text-neon-pink">{highScore}</span></span>
            <span className="text-gray-400">SPEED: <span className="text-neon-blue">{Math.round(1000 / speedRef.current)} TPS</span></span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] leading-none">
            {score.toString().padStart(3, '0')}
          </div>
          <div className="text-[10px] md:text-xs text-neon-green uppercase tracking-[0.2em] mt-1">Current Score</div>
        </div>
      </div>

      {/* AI Commentary Bubble */}
      <div className="h-10 md:h-12 w-full max-w-lg mb-2 z-20 flex items-center justify-center px-4">
        {commentary && (
          <div className={`
            flex items-center gap-2 md:gap-3 px-4 py-1.5 md:px-6 md:py-2 rounded-full border backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-lg
            ${commentary.mood === 'excited' ? 'border-neon-green bg-neon-green/10 text-neon-green' : 
              commentary.mood === 'sarcastic' ? 'border-neon-pink bg-neon-pink/10 text-neon-pink' : 
              'border-neon-blue bg-neon-blue/10 text-neon-blue'}
          `}>
            {modelLoading ? <Cpu className="w-3 h-3 md:w-4 md:h-4 animate-pulse" /> : <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />}
            <span className="font-mono font-bold text-xs md:text-sm truncate max-w-[80vw]">
              "{commentary.text}"
            </span>
          </div>
        )}
      </div>

      {/* Game Board Container with Scaling */}
      <div 
        className="relative z-10 mb-4 flex justify-center items-center transition-transform duration-300 ease-out"
        style={{
          width: gameSizePx * boardScale,
          height: gameSizePx * boardScale
        }}
      >
        {/* The internal div keeps fixed logic size, but is scaled via CSS transform */}
        <div style={{
          width: gameSizePx,
          height: gameSizePx,
          transform: `scale(${boardScale})`,
          transformOrigin: 'center',
          position: 'absolute'
        }}>
          <SnakeBoard snake={snake} food={food} />
          <GameOverlay 
            status={status} 
            score={score}
            initialSpeed={initialSpeed}
            setInitialSpeed={setInitialSpeed}
            onStart={handleStartGame} 
            onRestart={handleStartGame}
            onExit={handleExit}
          />
        </div>
      </div>

      {/* On-Screen Controls (D-Pad) */}
      <div className="z-20 flex flex-col items-center gap-1 md:gap-2 mt-auto md:mt-0">
         {/* Up Button */}
         <button 
           className="w-14 h-14 md:w-16 md:h-16 bg-gray-800/80 border border-neon-blue/50 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black active:scale-95 transition-all shadow-lg touch-manipulation backdrop-blur-sm"
           onPointerDown={(e) => { e.preventDefault(); changeDirection(Direction.UP); }}
         >
           <ChevronUp size={32} />
         </button>
         
         <div className="flex gap-2 md:gap-4">
           {/* Left Button */}
           <button 
             className="w-14 h-14 md:w-16 md:h-16 bg-gray-800/80 border border-neon-blue/50 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black active:scale-95 transition-all shadow-lg touch-manipulation backdrop-blur-sm"
             onPointerDown={(e) => { e.preventDefault(); changeDirection(Direction.LEFT); }}
           >
             <ChevronLeft size={32} />
           </button>
           
           {/* Down Button */}
           <button 
             className="w-14 h-14 md:w-16 md:h-16 bg-gray-800/80 border border-neon-blue/50 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black active:scale-95 transition-all shadow-lg touch-manipulation backdrop-blur-sm"
             onPointerDown={(e) => { e.preventDefault(); changeDirection(Direction.DOWN); }}
           >
             <ChevronDown size={32} />
           </button>
           
           {/* Right Button */}
           <button 
             className="w-14 h-14 md:w-16 md:h-16 bg-gray-800/80 border border-neon-blue/50 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black active:scale-95 transition-all shadow-lg touch-manipulation backdrop-blur-sm"
             onPointerDown={(e) => { e.preventDefault(); changeDirection(Direction.RIGHT); }}
           >
             <ChevronRight size={32} />
           </button>
         </div>
      </div>

      {/* Controls Hint Text */}
      <div className="mt-4 text-gray-600 font-mono text-xs hidden md:flex gap-8">
        <span className="flex items-center gap-2"><kbd className="bg-gray-800 px-2 py-1 rounded border border-gray-700">WASD</kbd> TO MOVE</span>
        <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> FAST AI ENABLED</span>
      </div>

    </div>
  );
};

export default App;
