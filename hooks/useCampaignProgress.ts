'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { LevelProgress } from '@/types/puzzle';
import {
  getStoredProgress,
  saveLevelResult as saveStoredResult,
  getTotalEarnedStars,
} from '@/lib/storage';

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

let cachedProgressStr = '';
let cachedProgressObj: Record<number, LevelProgress> = {};

function getProgressSnapshot(): Record<number, LevelProgress> {
  const current = getStoredProgress();
  const str = JSON.stringify(current);
  if (str !== cachedProgressStr) {
    cachedProgressStr = str;
    cachedProgressObj = current;
  }
  return cachedProgressObj;
}

const emptyProgress: Record<number, LevelProgress> = {};

export function useCampaignProgress(totalLevels: number) {
  const campaignProgress = useSyncExternalStore(
    subscribe,
    getProgressSnapshot,
    () => emptyProgress
  );

  const totalStars = useSyncExternalStore(
    subscribe,
    getTotalEarnedStars,
    () => 0
  );

  const recordLevelCompletion = useCallback(
    (levelId: number, timeElapsed: number, moves: number, stars: number) => {
      const res = saveStoredResult(levelId, timeElapsed, moves, stars, totalLevels);
      notifyStorageChange();
      return res;
    },
    [totalLevels]
  );

  return {
    campaignProgress,
    totalStars,
    recordLevelCompletion,
  };
}
