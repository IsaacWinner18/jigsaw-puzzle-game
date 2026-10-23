'use client';

import React from 'react';
import { PuzzlePieceData, PuzzleConfig } from '@/types/puzzle';

interface PuzzleBoardProps {
  config: PuzzleConfig;
  pieces: PuzzlePieceData[];
  showGhost: boolean;
  isBlankBoard: boolean;
  ghostImageUrl: string | null;
  hintedPiece: PuzzlePieceData | null;
  isComplete: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  config,
  pieces,
  showGhost,
  isBlankBoard,
  ghostImageUrl,
  hintedPiece,
  isComplete,
  boardRef,
}) => {
  const { boardWidth, boardHeight, rows, cols } = config;
  const pw = boardWidth / cols;
  const ph = boardHeight / rows;

  const lockedPieces = pieces.filter((p) => p.isLocked);

  return (
    <div
      ref={boardRef}
      style={{
        width: `${boardWidth}px`,
        height: `${boardHeight}px`,
      }}
      className="relative rounded-2xl overflow-visible bg-slate-950/80 border-2 border-slate-700/80 shadow-2xl shadow-black/80 select-none transition-all duration-300"
    >
      {/* Background Board Texture & Grid lines */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
            `,
            backgroundSize: `${pw}px ${ph}px`,
          }}
        />

        {/* Ghost Reference Image Overlay (hidden when isBlankBoard is active for Level 5+) */}
        {!isBlankBoard && showGhost && ghostImageUrl && (
          <img
            src={ghostImageUrl}
            alt="Puzzle Ghost Reference"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[0.3px] transition-opacity duration-300"
          />
        )}

        {/* Subtle Felt Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-950/70" />
      </div>

      {/* Target Hint Indicator Highlight */}
      {hintedPiece && !isComplete && (
        <div
          className="absolute pointer-events-none z-10 transition-all duration-300 animate-pulse border-2 border-amber-400 bg-amber-400/20 rounded-md"
          style={{
            left: `${hintedPiece.targetX}px`,
            top: `${hintedPiece.targetY}px`,
            width: `${pw}px`,
            height: `${ph}px`,
            boxShadow: '0 0 25px rgba(251, 191, 36, 0.6)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-amber-200 text-xs font-bold tracking-wider uppercase font-poppins">
            Place Here
          </div>
        </div>
      )}

      {/* Locked Pieces (permanently snapped onto the board) */}
      <div className="absolute inset-0 pointer-events-none">
        {lockedPieces.map((piece) => (
          <img
            key={`locked-${piece.id}`}
            src={piece.canvasDataUrl}
            alt={`Locked Piece ${piece.id}`}
            style={{
              position: 'absolute',
              left: `${piece.targetX - piece.tabSize}px`,
              top: `${piece.targetY - piece.tabSize}px`,
              width: `${piece.canvasWidth}px`,
              height: `${piece.canvasHeight}px`,
              zIndex: 10,
            }}
            className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-opacity duration-200"
          />
        ))}
      </div>

      {/* Seamless Completed Image Overlay on Victory */}
      {isComplete && ghostImageUrl && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-20 animate-fade-in transition-opacity duration-700">
          <img
            src={ghostImageUrl}
            alt="Completed Masterpiece"
            className="w-full h-full object-cover"
          />
          {/* Subtle victory shine sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Board Frame Coordinates & Corner Brackets */}
      <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400/60 rounded-tl pointer-events-none" />
      <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-amber-400/60 rounded-tr pointer-events-none" />
      <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-amber-400/60 rounded-bl pointer-events-none" />
      <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400/60 rounded-br pointer-events-none" />
    </div>
  );
};
