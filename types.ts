export interface Coordinate {
  x: number;
  y: number;
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

export interface AIAnalysisResult {
  analysis: string;
  scoreRating: string;
  tips: string[];
}

export interface AICommentary {
  text: string;
  mood: 'neutral' | 'excited' | 'sarcastic';
}