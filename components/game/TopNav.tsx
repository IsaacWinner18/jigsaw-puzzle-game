'use client';

import React from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Sparkles,
  Filter,
  RefreshCw,
  Star,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { PuzzleLevel } from '@/types/puzzle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TopNavProps {
  currentLevel: PuzzleLevel | null;
  totalStars: number;
  timeElapsed: number;
  lockedCount: number;
  totalPieces: number;
  hintsRemaining: number;
  isMuted: boolean;
  onToggleMute: () => void;
  showGhost: boolean;
  onToggleGhost: () => void;
  filterEdgesOnly: boolean;
  onToggleEdgesOnly: () => void;
  onTriggerHint: () => void;
  onRearrangeTray: () => void;
  onReturnToCampaignMap: () => void;
  adaptiveDifficulty: boolean;
  onToggleAdaptive: () => void;
  isHintActive: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentLevel,
  totalStars,
  timeElapsed,
  lockedCount,
  totalPieces,
  hintsRemaining,
  isMuted,
  onToggleMute,
  showGhost,
  onToggleGhost,
  filterEdgesOnly,
  onToggleEdgesOnly,
  onTriggerHint,
  onRearrangeTray,
  onReturnToCampaignMap,
  adaptiveDifficulty,
  onToggleAdaptive,
  isHintActive,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLevelPlaying = currentLevel !== null;

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-slate-100 select-none sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand & Campaign Context */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isLevelPlaying ? (
            <Button
              variant="default"
              size="sm"
              onClick={onReturnToCampaignMap}
              className="gap-1 px-2 sm:px-2.5 h-7"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Levels</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onReturnToCampaignMap}
              className="gap-1 px-2 sm:px-2.5 h-7"
              title="Return to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          )}

          <div className="flex flex-col">
            <span
              onClick={onReturnToCampaignMap}
              className="text-base sm:text-xl font-anton tracking-wider text-white uppercase whitespace-nowrap cursor-pointer hover:text-amber-400 transition-colors"
            >
              Jigsaw Atelier
            </span>
            {isLevelPlaying && currentLevel && (
              <span className="text-[10px] sm:text-[11px] text-amber-400 font-poppins font-medium truncate max-w-[110px] sm:max-w-[220px]">
                Lvl {currentLevel.id}: {currentLevel.title}
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Essential Live Stats & Gameplay Tools */}
        <div className="flex items-center gap-3 sm:gap-5 text-sm font-poppins text-slate-300">
          {isLevelPlaying && (
            <div className="hidden md:flex items-center gap-2 text-xs font-inter text-slate-400">
              <span className="text-slate-200 font-semibold tabular-nums">{formatTime(timeElapsed)}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                <strong className="text-amber-400 font-semibold">{lockedCount}</strong>/{totalPieces} pieces
              </span>
            </div>
          )}

          {isLevelPlaying && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-700/60 font-poppins">
              {/* Ghost Guide Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={showGhost ? 'amberOutline' : 'ghost'}
                    onClick={onToggleGhost}
                    className="gap-1 px-1.5 sm:px-2.5 h-7"
                  >
                    {showGhost ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">Guide</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showGhost ? 'Hide Background Ghost Guide' : 'Show Background Ghost Guide'}
                </TooltipContent>
              </Tooltip>

              {/* Adaptive Difficulty Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={adaptiveDifficulty ? 'amber' : 'ghost'}
                    onClick={onToggleAdaptive}
                    className="gap-1 px-1.5 sm:px-2.5 h-7"
                  >
                    <Zap className={`w-3.5 h-3.5 ${adaptiveDifficulty ? 'fill-current' : ''}`} />
                    <span className="hidden md:inline">Adaptive</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {adaptiveDifficulty
                    ? 'Adaptive Difficulty: ON (Scales piece grids & textures based on player skill)'
                    : 'Adaptive Difficulty: OFF (Click to enable)'}
                </TooltipContent>
              </Tooltip>

              {/* Edge Piece Filter */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={filterEdgesOnly ? 'amberOutline' : 'ghost'}
                    onClick={onToggleEdgesOnly}
                    className="gap-1 px-1.5 sm:px-2.5 h-7"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Borders</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {filterEdgesOnly ? 'Show All Pieces' : 'Highlight Border Pieces'}
                </TooltipContent>
              </Tooltip>

              {/* Hint Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isHintActive ? 'amber' : 'ghost'}
                    disabled={isHintActive || lockedCount === totalPieces || hintsRemaining === 0}
                    onClick={onTriggerHint}
                    className="gap-1 px-1.5 sm:px-2.5 h-7"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Hint</span>
                    {hintsRemaining >= 0 && (
                      <span className="text-[10px] font-mono text-amber-300 font-bold">({hintsRemaining})</span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hintsRemaining === -1
                    ? 'Highlight a candidate piece and target position'
                    : `${hintsRemaining} hint${hintsRemaining === 1 ? '' : 's'} remaining`}
                </TooltipContent>
              </Tooltip>

              {/* Rearrange Tray */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRearrangeTray}
                    className="gap-1 px-1.5 sm:px-2.5 h-7"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Arrange</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Neatly sort loose pieces into the side trays</TooltipContent>
              </Tooltip>

              {/* Audio Mute Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                    className="h-7 w-7"
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Zone 3: Campaign Stars Badge */}
        <div className="flex items-center gap-2 shrink-0 font-poppins">
          <button
            onClick={onReturnToCampaignMap}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-amber-400 transition-colors"
            title="Total Stars Earned"
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
            <span className="text-xs font-inter font-bold text-white">{totalStars}</span>
            <span className="text-[11px] text-slate-400 font-inter font-normal hidden sm:inline">Stars</span>
          </button>
        </div>
      </div>
    </header>
  );
};
