'use client';

import React from 'react';
import { PuzzlePieceData } from '@/types/puzzle';

interface PuzzlePieceProps {
  piece: PuzzlePieceData;
  isDragging: boolean;
  isHinted: boolean;
  filterEdgesOnly: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, piece: PuzzlePieceData) => void;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  isDragging,
  isHinted,
  filterEdgesOnly,
  onPointerDown,
}) => {
  // If piece is already snapped and locked, it's rendered directly inside the board component
  if (piece.isLocked) {
    return null;
  }

  const isDimmed = filterEdgesOnly && !piece.isEdgePiece;

  // Position is nominal (currentX, currentY) minus tabSize because canvas has tab extensions on all sides
  const visualLeft = piece.currentX - piece.tabSize;
  const visualTop = piece.currentY - piece.tabSize;

  return (
    <div
      onPointerDown={(e) => {
        if (!isDimmed) {
          onPointerDown(e, piece);
        }
      }}
      style={{
        position: 'absolute',
        left: `${visualLeft}px`,
        top: `${visualTop}px`,
        width: `${piece.canvasWidth}px`,
        height: `${piece.canvasHeight}px`,
        zIndex: isDragging ? 1000 : isHinted ? 500 : piece.zIndex,
        touchAction: 'none',
      }}
      className={`select-none transition-transform duration-75 ${
        isDimmed
          ? 'opacity-20 pointer-events-none filter grayscale'
          : 'cursor-grab active:cursor-grabbing hover:scale-[1.03] pointer-events-auto'
      } ${
        isDragging
          ? 'scale-[1.06] filter drop-shadow-[0_16px_30px_rgba(0,0,0,0.7)]'
          : 'filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]'
      }`}
    >
      <img
        src={piece.canvasDataUrl}
        alt={`Piece ${piece.id}`}
        draggable={false}
        className={`w-full h-full pointer-events-none transition-all duration-200 ${
          isHinted
            ? 'filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-[1.04]'
            : ''
        }`}
      />
    </div>
  );
};
