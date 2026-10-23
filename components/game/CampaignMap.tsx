'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Star, Lock, Play, Sparkles, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { CAMPAIGN_LEVELS } from '@/lib/levelData';
import { PuzzleLevel, LevelProgress } from '@/types/puzzle';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CampaignMapProps {
  progress: Record<number, LevelProgress>;
  totalStars: number;
  onSelectLevel: (level: PuzzleLevel) => void;
}

// Global cache for procedural artwork thumbnails to ensure zero lag & no repeated re-draws
const thumbnailCache = new Map<number, string>();

const LevelThumbnail: React.FC<{
  level: PuzzleLevel;
  isUnlocked: boolean;
}> = ({ level, isUnlocked }) => {
  const [dataUrl, setDataUrl] = useState<string>(() => level.imageUrl || thumbnailCache.get(level.id) || '');

  useEffect(() => {
    if (level.imageUrl) {
      setDataUrl(level.imageUrl);
      return;
    }
    if (thumbnailCache.has(level.id)) {
      setDataUrl(thumbnailCache.get(level.id)!);
      return;
    }

    try {
      const artCanvas = level.generateArt();
      const thumb = document.createElement('canvas');
      thumb.width = 240;
      thumb.height = 180;
      const ctx = thumb.getContext('2d');
      if (ctx) {
        ctx.drawImage(artCanvas, 0, 0, 240, 180);
        const url = thumb.toDataURL('image/jpeg', 0.85);
        thumbnailCache.set(level.id, url);
        setDataUrl(url);
      }
    } catch (err) {
      console.error('Error generating level thumbnail', level.id, err);
    }
  }, [level]);

  return (
    <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 mb-3 group-hover:border-slate-700 transition-colors">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={level.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !isUnlocked ? 'filter blur-sm opacity-25 grayscale brightness-50' : ''
          }`}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-slate-900 animate-pulse" />
      )}

      {!isUnlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] text-slate-400">
          <div className="w-8 h-8 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center shadow-lg">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export const CampaignMap: React.FC<CampaignMapProps> = ({
  progress,
  totalStars,
  onSelectLevel,
}) => {
  const [filter, setFilter] = useState<'all' | 'ready' | 'completed'>('all');

  const formatTime = (secs: number) => {
    if (!secs) return '--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalLevels = CAMPAIGN_LEVELS.length;
  const completedCount = useMemo(() => {
    return CAMPAIGN_LEVELS.filter((l) => progress[l.id]?.completed).length;
  }, [progress]);

  const maxStars = totalLevels * 3;

  // Identify next uncompleted, unlocked level for 1-click continuation
  const nextPlayableLevel = useMemo(() => {
    return (
      CAMPAIGN_LEVELS.find((l) => {
        const p = progress[l.id];
        const isUnlocked = p?.unlocked || l.id === 1;
        return isUnlocked && !p?.completed;
      }) || null
    );
  }, [progress]);

  // Filtered levels list
  const filteredLevels = useMemo(() => {
    return CAMPAIGN_LEVELS.filter((level) => {
      const p = progress[level.id];
      const isUnlocked = p?.unlocked || level.id === 1;
      const isCompleted = p?.completed;

      if (filter === 'completed') return isCompleted;
      if (filter === 'ready') return isUnlocked && !isCompleted;
      return true;
    });
  }, [filter, progress]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in select-none font-inter">
      {/* Header Banner: Clean, Trackable Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          
          <h1 className="text-3xl sm:text-4xl font-anton tracking-wider uppercase text-white">
            Puzzle Levels
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl font-inter">
            Select a puzzle to solve. Complete levels to earn stars and tackle larger piece counts.
          </p>
        </div>

        {/* Global Progress Strip */}
        <div className="flex items-center gap-3 sm:gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 px-5 shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold font-poppins">Solved</div>
              <div className="text-lg sm:text-xl font-anton tracking-wider text-white leading-none">
                {completedCount} <span className="text-xs font-inter font-normal text-slate-400">/ {totalLevels}</span>
              </div>
            </div>
          </div>

          <div className="w-[1px] h-8 bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold font-poppins">Total Stars</div>
              <div className="text-lg sm:text-xl font-anton tracking-wider text-white leading-none">
                {totalStars} <span className="text-xs font-inter font-normal text-slate-400">/ {maxStars}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Resume Hero: 1-Click to Continue */}
      {nextPlayableLevel ? (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-anton flex items-center justify-center text-lg shrink-0 shadow-md shadow-amber-400/20">
              {nextPlayableLevel.id}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 font-poppins">
                Current Objective · Next Up
              </div>
              <div className="text-base sm:text-lg font-poppins font-bold text-white">
                {nextPlayableLevel.title}
              </div>
              <div className="text-xs text-slate-400 font-inter">
                {nextPlayableLevel.totalPieces} pieces · {nextPlayableLevel.rows}×{nextPlayableLevel.cols} · {nextPlayableLevel.difficulty}
              </div>
            </div>
          </div>

          <Button
            onClick={() => onSelectLevel(nextPlayableLevel)}
            variant="amber"
            size="lg"
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            <span>Play Level {nextPlayableLevel.id}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-sm font-bold text-white font-poppins">All 17 Levels Completed!</div>
              <div className="text-xs text-slate-400 font-inter">You have mastered the complete atelier collection.</div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Filter Pills */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-poppins font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          All Levels ({totalLevels})
        </button>

        <button
          onClick={() => setFilter('ready')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-poppins font-semibold transition-all cursor-pointer ${
            filter === 'ready'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          Ready to Play
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-poppins font-semibold transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          Solved ({completedCount})
        </button>
      </div>

      {/* Straightforward Trackable Level Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
        {filteredLevels.map((level) => {
          const p = progress[level.id];
          const isUnlocked = p?.unlocked || level.id === 1;
          const isCompleted = p?.completed;
          const stars = p?.stars || 0;
          const isNextUp = nextPlayableLevel?.id === level.id;

          return (
            <Card
              key={level.id}
              className={`group flex flex-col justify-between transition-all duration-200 border rounded-2xl ${
                !isUnlocked
                  ? 'border-slate-800/60 bg-slate-900/30 opacity-70'
                  : isNextUp
                  ? 'border-amber-400/80 bg-slate-900 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                  : isCompleted
                  ? 'border-slate-800 bg-slate-900/80 hover:border-amber-400/50'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-anton tracking-wider text-amber-400 uppercase">
                    Level {level.id}
                  </span>

                  {isCompleted ? (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600 fill-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  ) : isNextUp ? (
                    <Badge variant="amber">Next Up</Badge>
                  ) : isUnlocked ? (
                    <Badge variant="emerald">Ready</Badge>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-inter text-slate-500">
                      <Lock className="w-3 h-3" /> Locked
                    </div>
                  )}
                </div>

                {/* Visual Artwork Thumbnail */}
                <LevelThumbnail level={level} isUnlocked={isUnlocked} />

                <CardTitle className="text-base font-poppins font-bold text-white mb-0.5 truncate">
                  {level.title}
                </CardTitle>
                <p className="text-xs font-inter text-slate-400 line-clamp-1">{level.subtitle}</p>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-inter mt-2.5">
                  <span className="text-amber-300 font-semibold">{level.totalPieces} pieces</span>
                  <span>·</span>
                  <span>{level.rows}×{level.cols}</span>
                  <span>·</span>
                  <span className="text-slate-500">{level.difficulty}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1">
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {isCompleted ? (
                    <div className="text-[11px] font-inter text-slate-400">
                      Best: <strong className="text-slate-200 font-semibold">{formatTime(p.bestTime)}</strong>
                    </div>
                  ) : (
                    <div className="text-[11px] font-inter text-slate-500">
                      {isUnlocked ? 'Not yet solved' : `Complete Lvl ${level.id - 1}`}
                    </div>
                  )}

                  <Button
                    disabled={!isUnlocked}
                    onClick={() => onSelectLevel(level)}
                    variant={isNextUp ? 'amber' : isCompleted ? 'default' : 'amber'}
                    size="sm"
                    className="gap-1.5"
                  >
                    {isCompleted ? (
                      <>
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Replay</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
