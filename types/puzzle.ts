export type EdgeType = -1 | 0 | 1; // -1: blank (indent), 0: flat boundary, 1: tab (protrusion)

export interface PieceEdges {
  top: EdgeType;
  right: EdgeType;
  bottom: EdgeType;
  left: EdgeType;
}

export interface PuzzlePieceData {
  id: number;
  row: number;
  col: number;
  edges: PieceEdges;
  isEdgePiece: boolean;
  targetX: number; // nominal target top-left on board
  targetY: number;
  currentX: number; // nominal current top-left on board/table
  currentY: number;
  width: number; // nominal width (pw)
  height: number; // nominal height (ph)
  tabSize: number;
  canvasDataUrl: string; // pre-rendered canvas data URL
  canvasWidth: number; // pw + 2 * tabSize
  canvasHeight: number; // ph + 2 * tabSize
  isLocked: boolean;
  zIndex: number;
}

export interface PuzzleConfig {
  rows: number;
  cols: number;
  boardWidth: number;
  boardHeight: number;
  tabRatio: number; // e.g. 0.22
  snapThreshold: number; // 15px
  pieceStyle: 'classic' | 'geometric';
  adaptiveDifficulty: boolean;
  adaptiveSkillFactor: number; // 1.0 = normal, 1.25 = advanced, 1.5 = master
}

export interface PresetArtwork {
  id: string;
  title: string;
  author: string;
  category: string;
  generate: () => HTMLCanvasElement;
}

export interface PuzzleLevel {
  id: number;
  worldId: 1 | 2 | 3;
  worldName: string;
  title: string;
  subtitle: string;
  description: string;
  rows: number;
  cols: number;
  totalPieces: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert';
  targetTimeSeconds: number; // Target for 3-star rating
  twoStarTimeSeconds: number; // Target for 2-star rating
  maxHints: number; // -1 for unlimited, or e.g. 3, 2, 1
  imageUrl?: string;
  generateArt: (w?: number, h?: number) => HTMLCanvasElement;
}

export interface LevelProgress {
  levelId: number;
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0 to 3
  bestTime: number; // in seconds
  bestMoves: number;
}

export type GameMode = 'campaign' | 'free_studio';
export type GameStatus = 'idle' | 'ready' | 'playing' | 'completed';
