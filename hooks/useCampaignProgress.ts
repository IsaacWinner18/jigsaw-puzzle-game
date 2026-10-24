'use client';

import { useSyncExternalStore, useCallback, useEffect } from 'react';
import { LevelProgress } from '@/types/puzzle';
import {
  getStoredProgress,
  saveLevelResult as saveStoredResult,
  getTotalEarnedStars,
  syncCloudProgress,
} from '@/lib/storage';
import { usePassizy } from '@/hooks/usePassizy';

const STORAGE_EVENT = 'jigsaw_storage_update';
function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

let activeStudentId: string | null = null;
let cachedProgressStr = '';
let cachedProgressObj: Record<number, LevelProgress> = {};

function getProgressSnapshot(): Record<number, LevelProgress> {
  const current = getStoredProgress(activeStudentId);
  const str = JSON.stringify(current);
  if (str !== cachedProgressStr) {
    cachedProgressStr = str;
    cachedProgressObj = current;
  }
  return cachedProgressObj;
}

function getTotalStarsSnapshot(): number {
  return getTotalEarnedStars(activeStudentId);
}

const emptyProgress: Record<number, LevelProgress> = {};

export function useCampaignProgress(totalLevels: number) {
  const { student } = usePassizy();
  const currentStudentId = student?.id || null;

  // Sync active student ID with module-level storage reader
  if (activeStudentId !== currentStudentId) {
    activeStudentId = currentStudentId;
    cachedProgressStr = '';
  }

  // Initial and reactive cloud synchronization
  useEffect(() => {
    let isCancelled = false;
    activeStudentId = currentStudentId;

    syncCloudProgress(currentStudentId)
      .then(() => {
        if (!isCancelled) {
          notifyStorageChange();
        }
      })
      .catch((err) => {
        console.warn('[CampaignProgress] Cloud sync notice:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentStudentId]);

  const campaignProgress = useSyncExternalStore(
    subscribe,
    getProgressSnapshot,
    () => emptyProgress
  );

  const totalStars = useSyncExternalStore(
    subscribe,
    getTotalStarsSnapshot,
    () => 0
  );

  const recordLevelCompletion = useCallback(
    (levelId: number, timeElapsed: number, moves: number, stars: number) => {
      const res = saveStoredResult(levelId, timeElapsed, moves, stars, totalLevels, currentStudentId);
      notifyStorageChange();
      return res;
    },
    [totalLevels, currentStudentId]
  );

  return {
    campaignProgress,
    totalStars,
    recordLevelCompletion,
  };
}
