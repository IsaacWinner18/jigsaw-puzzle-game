'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/game/TopNav';
import { CampaignMap } from '@/components/game/CampaignMap';
import { CAMPAIGN_LEVELS } from '@/lib/levelData';
import { useCampaignProgress } from '@/hooks/useCampaignProgress';
import { usePassizy } from '@/hooks/usePassizy';
import { PuzzleLevel } from '@/types/puzzle';

export default function SoloCampaignPage() {
  const router = useRouter();
  const { campaignProgress, totalStars } = useCampaignProgress(CAMPAIGN_LEVELS.length);
  const { triggerHaptic, hideBackButton } = usePassizy();

  useEffect(() => {
    hideBackButton();
  }, [hideBackButton]);

  const handleSelectLevel = (level: PuzzleLevel) => {
    triggerHaptic('light');
    router.push(`/play/${level.id}`);
  };

  const handleReturnToHome = () => {
    triggerHaptic('light');
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-inter select-none overflow-x-hidden">
      {/* Top Navigation */}
      <TopNav
        currentLevel={null}
        totalStars={totalStars}
        timeElapsed={0}
        lockedCount={0}
        totalPieces={0}
        hintsRemaining={-1}
        isMuted={false}
        onToggleMute={() => {}}
        showGhost={false}
        onToggleGhost={() => {}}
        filterEdgesOnly={false}
        onToggleEdgesOnly={() => {}}
        onTriggerHint={() => {}}
        onRearrangeTray={() => {}}
        onReturnToCampaignMap={handleReturnToHome}
        adaptiveDifficulty={false}
        onToggleAdaptive={() => {}}
        isHintActive={false}
      />

      {/* Campaign Map & Level Selection View */}
      <main className="flex-1 w-full">
        <CampaignMap
          progress={campaignProgress}
          totalStars={totalStars}
          onSelectLevel={handleSelectLevel}
        />
      </main>
    </div>
  );
}
