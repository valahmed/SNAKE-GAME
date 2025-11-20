import React from 'react';
import { Coordinate } from '../types';
import { GRID_SIZE, BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

interface SnakeBoardProps {
  snake: Coordinate[];
  food: Coordinate;
}

const SnakeBoard: React.FC<SnakeBoardProps> = ({ snake, food }) => {
  // Create grid background cells
  const gridCells = [];
  for (let i = 0; i < BOARD_HEIGHT * BOARD_WIDTH; i++) {
    gridCells.push(i);
  }

  return (
    <div 
      className="relative bg-black border-4 border-gray-800 shadow-[0_0_50px_rgba(0,255,255,0.1)] overflow-hidden"
      style={{
        width: BOARD_WIDTH * GRID_SIZE,
        height: BOARD_HEIGHT * GRID_SIZE,
      }}
    >
      {/* Grid Lines */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#1f2937 1px, transparent 1px), linear-gradient(90deg, #1f2937 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
        }}
      />

      {/* Snake */}
      {snake.map((segment, index) => {
        const isHead = index === 0;
        return (
          <div
            key={`${segment.x}-${segment.y}-${index}`}
            className={`absolute transition-all duration-75 ${
              isHead ? 'z-20' : 'z-10'
            }`}
            style={{
              left: segment.x * GRID_SIZE,
              top: segment.y * GRID_SIZE,
              width: GRID_SIZE,
              height: GRID_SIZE,
            }}
          >
            <div className={`
              w-full h-full 
              ${isHead ? 'bg-neon-green shadow-neon-green rounded-sm' : 'bg-green-600/80 rounded-md scale-90'}
            `}></div>
          </div>
        );
      })}

      {/* Food */}
      <div
        className="absolute z-10 animate-bounce"
        style={{
          left: food.x * GRID_SIZE,
          top: food.y * GRID_SIZE,
          width: GRID_SIZE,
          height: GRID_SIZE,
        }}
      >
        <div className="w-full h-full bg-neon-pink rounded-full shadow-neon-pink animate-pulse transform scale-75"></div>
      </div>
    </div>
  );
};

export default SnakeBoard;