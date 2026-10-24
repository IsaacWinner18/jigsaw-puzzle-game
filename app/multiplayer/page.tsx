'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Users, Check, ArrowRight, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MULTIPLAYER_PUZZLES, MultiplayerPuzzleTheme, preloadPuzzleImage } from '@/lib/multiplayerPuzzles';
import { generateRoomCode } from '@/lib/seededRandom';
import { usePassizy } from '@/hooks/usePassizy';
import { getPlayerProfile, savePlayerName } from '@/lib/playerProfile';

export default function MultiplayerSetupPage() {
  const router = useRouter();
  const { student, triggerHaptic, startParam, isInitialized } = usePassizy();
  const [selectedPuzzle, setSelectedPuzzle] = useState<MultiplayerPuzzleTheme>(MULTIPLAYER_PUZZLES[0]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('Challenger');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-route if deep-linked to a room
  useEffect(() => {
    if (!startParam) return;
    if (startParam.startsWith('room_')) {
      const code = startParam.replace('room_', '').trim().toUpperCase();
      if (code) router.replace(`/room/${code}`);
    } else if (/^[A-Za-z0-9]{4,6}$/.test(startParam)) {
      router.replace(`/room/${startParam.toUpperCase()}`);
    }
  }, [startParam, router]);

  useEffect(() => {
    const profile = getPlayerProfile(student);
    setPlayerName(profile.name);
  }, [student]);

  const scrollBy = (offset: number) => {
    triggerHaptic('light');
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Generate artwork thumbnails & preload 8K assets on mount
  useEffect(() => {
    const thumbs: Record<string, string> = {};
    MULTIPLAYER_PUZZLES.forEach((p) => {
      if (p.imageUrl) {
        thumbs[p.id] = p.imageUrl;
        preloadPuzzleImage(p.imageUrl);
      } else {
        try {
          const art = p.generateArt();
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(art, 0, 0, 320, 240);
            thumbs[p.id] = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch (err) {
          console.error('Failed generating multiplayer thumbnail', p.id, err);
        }
      }
    });
    setThumbnails(thumbs);
  }, []);

  const handleSelectPuzzle = (puzzle: MultiplayerPuzzleTheme) => {
    triggerHaptic('light');
    setSelectedPuzzle(puzzle);
  };

  const handleCreateRoom = async () => {
    if (!isInitialized) return;
    setIsCreating(true);
    setCreateError(null);
    triggerHaptic('medium');

    const roomCode = generateRoomCode();
    const profile = getPlayerProfile(student);
    const hostId = profile.id;
    const hostName = playerName.trim() || profile.name;
    savePlayerName(hostName);

    try {
      const res = await fetch('/api/multiplayer/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          code: roomCode,
          hostId,
          hostName,
          puzzleId: selectedPuzzle.id,
          difficulty: selectedPuzzle.difficulty,
          rows: selectedPuzzle.rows,
          cols: selectedPuzzle.cols,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize room');
      }
      setIsCreating(false);
      router.push(`/room/${roomCode}`);
    } catch (err) {
      console.error('Error creating room on server:', err);
      setCreateError(err instanceof Error ? err.message : 'Unable to create a room. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] sm:h-auto sm:min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-inter select-none overflow-hidden sm:overflow-auto pt-[max(10px,var(--passizy-safe-area-top))] pb-[max(12px,var(--passizy-safe-area-bottom))]">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            triggerHaptic('light');
            router.push('/');
          }}
          className="gap-1.5 h-8 px-3 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Button>

     
      </header>

      {/* Main Container - Compact vertical footprint */}
      <main className="w-full max-w-5xl mx-auto px-4 py-3 sm:py-4 flex-1 flex flex-col justify-between overflow-hidden">
        {/* Header Banner */}
        <div className="mb-2 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-0.5 font-poppins">
              <Users className="w-3.5 h-3.5" /> 1v1 Battle Arena
            </div>
            <h1 className="text-2xl sm:text-3xl font-anton tracking-wider uppercase text-white">
              Choose Battle Puzzle
            </h1>
          
          </div>

          {/* Competitor Name Pill */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 self-start sm:self-center">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-slate-400 font-poppins uppercase font-semibold">Your Name:</span>
            <input
              type="text"
              maxLength={20}
              value={playerName}
              onChange={(e) => {
                const val = e.target.value;
                setPlayerName(val);
                savePlayerName(val);
              }}
              className="bg-transparent text-xs font-semibold text-amber-400 focus:outline-none border-b border-dashed border-amber-400/50 w-28 sm:w-36 font-inter"
              placeholder="Your Name"
            />
          </div>
        </div>

        {/* Horizontal Scroll Track (10% peek on left & right) */}
        <div className="relative w-full my-auto shrink-0">
          {/* Scroll Nav Helpers */}
          <div className="flex items-center justify-between mb-2 px-0.5">
          
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => scrollBy(-300)}
                className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollBy(300)}
                className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scroll container with 10% peek of adjacent cards */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto py-1 px-4 -mx-4 scroll-smooth snap-x snap-mandatory focus:outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MULTIPLAYER_PUZZLES.map((puzzle) => {
              const isSelected = selectedPuzzle.id === puzzle.id;
              const totalPieces = puzzle.rows * puzzle.cols;

              return (
                <Card
                  key={puzzle.id}
                  onClick={() => handleSelectPuzzle(puzzle)}
                  className={`group relative cursor-pointer w-[76vw] max-w-[280px] sm:w-[270px] shrink-0 snap-center sm:snap-start flex flex-col justify-between transition-all duration-200 border rounded-2xl overflow-hidden ${
                    isSelected
                      ? 'border-amber-400 bg-slate-900 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/50 -translate-y-0.5'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-anton tracking-wider uppercase text-slate-300">
                        {puzzle.difficulty}
                      </span>
                      <Badge variant={isSelected ? 'amber' : 'default'} className="text-[10px] px-2 py-0.5">
                        {totalPieces} Pieces
                      </Badge>
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="relative w-full aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 mb-2">
                      {thumbnails[puzzle.id] ? (
                        <img
                          src={thumbnails[puzzle.id]}
                          alt={puzzle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-600 text-xs">
                          Loading 8K Art...
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <CardTitle className="text-sm font-poppins font-bold text-white mb-0.5 truncate">
                      {puzzle.title}
                    </CardTitle>
                    <p className="text-[11px] font-inter text-slate-400 line-clamp-1">{puzzle.tagline}</p>
                  </CardHeader>

                  <CardContent className="p-3 pt-1">
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-inter">
                      <span>Grid: <strong>{puzzle.rows}×{puzzle.cols}</strong></span>
                     
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Bar - Always visible, never pushed down */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl backdrop-blur-md shrink-0 mt-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-lg font-anton shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 font-poppins">
                Selected Arena
              </div>
              <div className="text-sm sm:text-base font-poppins font-bold text-white truncate">
                {selectedPuzzle.title} · {selectedPuzzle.rows * selectedPuzzle.cols} Pieces ({selectedPuzzle.difficulty})
              </div>
              <div className="text-[11px] text-slate-400 font-inter line-clamp-1">
                {selectedPuzzle.description}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateRoom}
            disabled={isCreating || !isInitialized}
            variant="amber"
            size="lg"
            className="gap-2 shrink-0 self-stretch sm:self-auto h-11 px-6 shadow-lg shadow-amber-500/15"
          >
            <span>{isCreating ? 'Creating Room...' : 'Create Battle Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          {createError && <p className="text-xs text-rose-400 sm:ml-auto">{createError}</p>}
        </div>
      </main>
    </div>
  );
}
