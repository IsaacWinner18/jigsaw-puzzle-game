'use client';

import { useEffect, useMemo, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TopNav } from '@/components/game/TopNav';
import { PuzzleBoard } from '@/components/game/PuzzleBoard';
import { PuzzlePiece } from '@/components/game/PuzzlePiece';
import { CornerReference } from '@/components/game/CornerReference';
import { VictoryModal } from '@/components/game/VictoryModal';
import { CAMPAIGN_LEVELS } from '@/lib/levelData';
import { useCampaignProgress } from '@/hooks/useCampaignProgress';
import { usePuzzleGame } from '@/hooks/usePuzzleGame';

function PlayGameContent() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const levelId = typeof rawId === 'string' ? parseInt(rawId, 10) : 1;

  const {
    campaignProgress,
    totalStars,
    recordLevelCompletion,
  } = useCampaignProgress(CAMPAIGN_LEVELS.length);

  const {
    currentLevel,
    config,
    pieces,
    ghostImageUrl,
    currentArtworkTitle,
    lockedCount,
    timeElapsed,
    isComplete,
    setIsComplete,
    showGhost,
    setShowGhost,
    filterEdgesOnly,
    setFilterEdgesOnly,
    hintedPiece,
    isMuted,
    toggleMute,
    hintsRemaining,
    dragState,
    tableRef,
    boardRef,
    handleStartLevel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTriggerHint,
    handleRearrangeTray,
    toggleAdaptive,
  } = usePuzzleGame({ campaignProgress });

  // Find target level definition
  const targetLevel = useMemo(() => {
    return CAMPAIGN_LEVELS.find((l) => l.id === levelId) || CAMPAIGN_LEVELS[0];
  }, [levelId]);

  // Track loaded level ID to prevent infinite level reload loops
  const loadedLevelIdRef = useRef<number | null>(null);

  // Load the target level on mount or route parameter change
  useEffect(() => {
    if (targetLevel && loadedLevelIdRef.current !== targetLevel.id) {
      loadedLevelIdRef.current = targetLevel.id;
      if (targetLevel.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = targetLevel.imageUrl;
        if (img.complete && img.naturalWidth > 0) {
          handleStartLevel(targetLevel);
        } else {
          img.onload = () => handleStartLevel(targetLevel);
          img.onerror = () => handleStartLevel(targetLevel);
        }
      } else {
        handleStartLevel(targetLevel);
      }
    }
  }, [targetLevel, handleStartLevel]);

  // Calculate earned stars dynamically based on benchmarks
  const earnedStars = useMemo(() => {
    if (!currentLevel) return 1;
    if (timeElapsed <= currentLevel.targetTimeSeconds) return 3;
    if (timeElapsed <= currentLevel.twoStarTimeSeconds) return 2;
    return 1;
  }, [currentLevel, timeElapsed]);

  // Handle Level Victory & Progression recording
  const recordedVictoryLevelId = useRef<number | null>(null);
  useEffect(() => {
    if (isComplete && currentLevel && recordedVictoryLevelId.current !== currentLevel.id) {
      recordedVictoryLevelId.current = currentLevel.id;
      recordLevelCompletion(
        currentLevel.id,
        timeElapsed,
        pieces.length,
        earnedStars
      );
    } else if (!isComplete) {
      recordedVictoryLevelId.current = null;
    }
  }, [isComplete, currentLevel, timeElapsed, pieces.length, earnedStars, recordLevelCompletion]);

  // Navigation handlers
  const hasPrevLevel = currentLevel ? currentLevel.id > 1 : false;
  const hasNextLevel = currentLevel ? currentLevel.id < CAMPAIGN_LEVELS.length : false;
  const isNextLevelUnlocked = currentLevel
    ? Boolean(campaignProgress[currentLevel.id + 1]?.unlocked)
    : false;

  const handlePrevLevel = () => {
    if (!currentLevel || currentLevel.id <= 1) return;
    router.push(`/play/${currentLevel.id - 1}`);
  };

  const handleNextLevel = () => {
    if (!currentLevel) return;
    if (hasNextLevel) {
      router.push(`/play/${currentLevel.id + 1}`);
    } else {
      router.replace('/solo');
    }
  };

  const handlePlayAgain = () => {
    if (currentLevel) {
      handleStartLevel(currentLevel);
    }
  };

  const handleReturnToLevels = () => {
    router.replace('/solo');
  };

  const isLevel5Plus = currentLevel ? currentLevel.id >= 5 : false;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden fixed inset-0 flex flex-col justify-between bg-slate-950 text-slate-100 font-inter select-none touch-none">
      {/* Top Navigation */}
      <TopNav
        currentLevel={currentLevel}
        totalStars={totalStars}
        timeElapsed={timeElapsed}
        lockedCount={lockedCount}
        totalPieces={pieces.length}
        hintsRemaining={hintsRemaining}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        showGhost={showGhost}
        onToggleGhost={() => setShowGhost(!showGhost)}
        filterEdgesOnly={filterEdgesOnly}
        onToggleEdgesOnly={() => setFilterEdgesOnly(!filterEdgesOnly)}
        onTriggerHint={handleTriggerHint}
        onRearrangeTray={handleRearrangeTray}
        onReturnToCampaignMap={handleReturnToLevels}
        adaptiveDifficulty={config.adaptiveDifficulty}
        onToggleAdaptive={toggleAdaptive}
        isHintActive={hintedPiece !== null}
      />

      {/* Main Tabletop Game Area (No scroll, strictly 100dvh) */}
      <main
        ref={tableRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 relative w-full flex flex-col items-center justify-start p-2 sm:p-4 overflow-hidden touch-none"
        style={{
          backgroundColor: '#090d16',
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%),
            radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px',
        }}
      >
      

        {/* Central Solving Mat Frame */}
        <div className="relative mt-0.5 sm:mt-1 z-10 shrink-0">
          <PuzzleBoard
            config={config}
            pieces={pieces}
            showGhost={showGhost}
            isBlankBoard={isLevel5Plus}
            ghostImageUrl={ghostImageUrl}
            hintedPiece={hintedPiece}
            isComplete={isComplete}
            boardRef={boardRef}
          />
        </div>

        {/* Draggable Puzzle Pieces Layer */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {pieces.map((piece) => (
            <PuzzlePiece
              key={piece.id}
              piece={piece}
              isDragging={dragState?.pieceId === piece.id}
              isHinted={hintedPiece?.id === piece.id}
              filterEdgesOnly={filterEdgesOnly}
              onPointerDown={handlePointerDown}
            />
          ))}
        </div>

        {/* Floating Corner Reference Image */}
        <CornerReference
          ghostImageUrl={ghostImageUrl}
          title={currentArtworkTitle}
          isLevel5Plus={isLevel5Plus}
          isComplete={isComplete}
        />
      </main>

      {/* Victory Celebration Modal */}
      {isComplete && (
        <VictoryModal
          currentLevel={currentLevel}
          timeElapsed={timeElapsed}
          totalPieces={pieces.length}
          earnedStars={earnedStars}
          onPlayAgain={handlePlayAgain}
          onNextLevel={handleNextLevel}
          onReturnToMap={handleReturnToLevels}
          hasNextLevel={
            currentLevel ? currentLevel.id < CAMPAIGN_LEVELS.length : false
          }
        />
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-950 text-amber-400 font-poppins">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-wider font-semibold">Preparing Atelier Canvas...</span>
          </div>
        </div>
      }
    >
      <PlayGameContent />
    </Suspense>
  );
}
