'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Clock, RotateCcw, ArrowRight, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '@/lib/audio';
import { PuzzleLevel } from '@/types/puzzle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface VictoryModalProps {
  currentLevel: PuzzleLevel | null;
  timeElapsed: number;
  totalPieces: number;
  earnedStars: number;
  onPlayAgain: () => void;
  onNextLevel?: () => void;
  onReturnToMap?: () => void;
  hasNextLevel: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  currentLevel,
  timeElapsed,
  totalPieces,
  earnedStars,
  onPlayAgain,
  onNextLevel,
  onReturnToMap,
  hasNextLevel,
}) => {
  const [revealedStars, setRevealedStars] = useState<number>(0);

  useEffect(() => {
    sound.playVictory();

    // Trigger celebratory confetti (subtle & elegant)
    const duration = 800;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 45,
        origin: { x: 0 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        ticks: 200,
        gravity: 0.9,
        scalar: 0.8,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 45,
        origin: { x: 1 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        ticks: 200,
        gravity: 0.9,
        scalar: 0.8,
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    const starTarget = currentLevel ? earnedStars : 3;
    let s = 1;
    const timer = setInterval(() => {
      if (s <= starTarget) {
        setRevealedStars(s);
        s++;
      } else {
        clearInterval(timer);
      }
    }, 350);

    return () => clearInterval(timer);
  }, [currentLevel, earnedStars]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && onReturnToMap) onReturnToMap(); }}>
      <DialogContent className="max-w-md p-6 sm:p-8 text-center bg-slate-900 border-slate-800" hideCloseButton={true}>
        <DialogHeader className="items-center">
          {/* Animated Stars Display */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {[1, 2, 3].map((starNum) => (
              <div
                key={starNum}
                className={`transition-all duration-300 transform ${
                  starNum <= revealedStars
                    ? 'scale-110 text-amber-400 rotate-0'
                    : 'scale-90 text-slate-700 rotate-[-12deg]'
                }`}
              >
                <Star
                  className={`w-10 h-10 ${
                    starNum <= revealedStars
                      ? 'fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                      : 'fill-slate-800'
                  }`}
                />
              </div>
            ))}
          </div>

          <DialogTitle className="text-3xl sm:text-4xl font-anton tracking-wider uppercase text-amber-400 mb-1 text-center">
            {currentLevel ? `Level ${currentLevel.id} Complete!` : 'Puzzle Complete!'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm font-poppins text-slate-300 mb-4 text-center">
            {currentLevel ? currentLevel.title : 'Every piece interlocked perfectly.'}
          </DialogDescription>
        </DialogHeader>

        {/* Essential Stats (Time & Pieces) */}
        <div className="grid grid-cols-2 gap-3 py-3 mb-4 border-y border-slate-800 text-left font-poppins">
          <div className="p-2">
            <span className="text-xs text-slate-400 mb-0.5 flex items-center gap-1 font-poppins">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Time Taken
            </span>
            <span className="text-base font-semibold font-inter text-slate-100">
              {formatTime(timeElapsed)}
            </span>
          </div>
          <div className="p-2">
            <span className="text-xs text-slate-400 mb-0.5 flex items-center gap-1 font-poppins">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pieces Placed
            </span>
            <span className="text-base font-semibold font-inter text-slate-100">
              {totalPieces} / {totalPieces}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 font-poppins">
          {hasNextLevel && onNextLevel && (
            <Button
              variant="amber"
              size="lg"
              onClick={onNextLevel}
              className="w-full gap-2 text-sm font-bold shadow-lg shadow-amber-500/20"
            >
              <span>Next Level (Unlocked!)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={onPlayAgain}
              className="flex-1 gap-2 py-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Replay</span>
            </Button>

            {onReturnToMap && (
              <Button
                variant="default"
                onClick={onReturnToMap}
                className="flex-1 py-2.5"
              >
                <span>Levels</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
