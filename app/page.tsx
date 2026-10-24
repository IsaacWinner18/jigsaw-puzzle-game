'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, User, ArrowRight, Gamepad2, ShieldCheck, Trophy, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerativeCanvasBackground } from '@/components/game/GenerativeCanvasBackground';
import { useCampaignProgress } from '@/hooks/useCampaignProgress';
import { usePassizy } from '@/hooks/usePassizy';
import { CAMPAIGN_LEVELS } from '@/lib/levelData';
import { getPlayerProfile } from '@/lib/playerProfile';

export default function Home() {
  const router = useRouter();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [inputError, setInputError] = useState('');
  const { totalStars } = useCampaignProgress(CAMPAIGN_LEVELS.length);
  const { student, triggerHaptic, startParam } = usePassizy();
  const [playerName, setPlayerName] = useState('Player');

  // Auto-route on deep link (e.g., ?startapp=room_ATEL42, ?startapp=level_3, ?startapp=solo, or direct code ?startapp=W9X2)
  useEffect(() => {
    if (!startParam) return;

    if (startParam.startsWith('room_')) {
      const targetRoom = startParam.replace('room_', '').trim().toUpperCase();
      if (targetRoom) {
        router.replace(`/room/${targetRoom}`);
      }
    } else if (startParam.startsWith('level_') || startParam.startsWith('solo_')) {
      const levelId = parseInt(startParam.replace(/^(level_|solo_)/, ''), 10);
      if (!isNaN(levelId) && levelId >= 1) {
        router.replace(`/play/${levelId}`);
      }
    } else if (startParam === 'solo') {
      router.replace('/solo');
    } else if (startParam === 'multiplayer') {
      router.replace('/multiplayer');
    } else if (/^[A-Za-z0-9]{4,6}$/.test(startParam)) {
      router.replace(`/room/${startParam.toUpperCase()}`);
    }
  }, [startParam, router]);

  useEffect(() => {
    const p = getPlayerProfile(student);
    setPlayerName(p.name);
  }, [student]);

  const handlePlaySolo = () => {
    triggerHaptic('light');
    router.push('/solo');
  };

  const handlePlayWithFriends = () => {
    triggerHaptic('light');
    router.push('/multiplayer');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCodeInput.trim().toUpperCase();
    if (!clean) {
      setInputError('Please enter a room code');
      return;
    }
    if (clean.length < 4) {
      setInputError('Room code must be at least 4 characters');
      return;
    }

    triggerHaptic('medium');
    router.push(`/room/${clean}`);
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-inter select-none overflow-x-hidden pt-[max(12px,var(--passizy-safe-area-top))] pb-[max(16px,var(--passizy-safe-area-bottom))]">
      {/* 3D Generative Perspective Grid Canvas Background */}
      <GenerativeCanvasBackground />

      {/* Top Floating Notch Context & Student Identity */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-slate-950 font-anton text-lg shadow-lg shadow-amber-500/20">
            🧩
          </div>
          <div>
            <div className="text-base font-anton tracking-wider text-white uppercase leading-none">
              Jigsaw Atelier
            </div>
           
          </div>
        </div>

        {/* Student Profile / Star Badge */}
        <div className="flex items-center gap-2">
          {student ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-poppins text-slate-300 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-white">{student.name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-[11px] text-slate-400">{student.department || 'Student'}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-poppins text-slate-300 backdrop-blur-md">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">{playerName}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-poppins text-amber-300 font-bold backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{totalStars} Stars</span>
          </div>
        </div>
      </header>

      {/* Hero Section & Main Action Cards */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 flex-1 flex flex-col items-center justify-center">
        {/* Main Title Badge */}
        <div className="text-center mb-8">
          

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-anton tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 uppercase drop-shadow-2xl">
            Jigsaw Puzzle Game
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-inter">
            Solve classic jigsaw puzzles solo or race in real-time speed battles with friends.
          </p>
        </div>

        {/* Primary Choice Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Option 1: Play Solo */}
          <div
            onClick={handlePlaySolo}
            className="group relative cursor-pointer p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/70 transition-all duration-300 shadow-xl backdrop-blur-md hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <User className="w-6 h-6" />
              </div>
             
              <h2 className="text-2xl font-anton tracking-wide text-white uppercase mb-2">
                Play Solo
              </h2>

              </div>

              <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-amber-400 text-slate-300 group-hover:text-slate-950 flex items-center justify-center transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* Option 2: Play with Friends */}
          <div
            onClick={handlePlayWithFriends}
            className="group relative cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/40 border border-indigo-500/30 hover:border-indigo-400 transition-all duration-300 shadow-xl backdrop-blur-md hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-4">
              <div  className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
             
              <h2 className="text-2xl font-anton tracking-wide text-white uppercase mb-2">
                Play With Friends
              </h2>

              </div>
             
              <div className="w-8 h-8 rounded-full bg-indigo-600/40 group-hover:bg-indigo-400 text-indigo-200 group-hover:text-slate-950 flex items-center justify-center transition-all">
                <Gamepad2 className="w-4 h-4" />
              </div>
            </div>

           
          </div>
        </div>

        {/* Option 3: Join Existing Room Input */}
        <div className="w-full max-w-lg p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">

            <div className="flex items-center gap-2">
              <input
                id="room-code-input"
                type="text"
                maxLength={8}
                value={roomCodeInput}
                onChange={(e) => {
                  setRoomCodeInput(e.target.value.toUpperCase());
                  if (inputError) setInputError('');
                }}
                placeholder="ENTER CODE"
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-center font-anton tracking-widest text-lg text-amber-400 placeholder:text-slate-600 focus:outline-none transition-colors uppercase"
              />

              <Button
                type="submit"
                variant="amber"
                size="default"
                className="h-11 px-5 gap-1.5"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {inputError && (
              <p className="text-[11px] text-rose-400 font-poppins">{inputError}</p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

