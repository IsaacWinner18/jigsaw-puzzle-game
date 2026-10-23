import { LevelProgress } from '../types/puzzle';

const STORAGE_KEY_PROGRESS = 'jigsaw_atelier_campaign_progress_v1';

export function getStoredProgress(): Record<number, LevelProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!data) {
      // Default: Level 1 unlocked
      const initial: Record<number, LevelProgress> = {
        1: {
          levelId: 1,
          unlocked: true,
          completed: false,
          stars: 0,
          bestTime: 0,
          bestMoves: 0,
        },
      };
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read campaign progress from localStorage', err);
    return {
      1: {
        levelId: 1,
        unlocked: true,
        completed: false,
        stars: 0,
        bestTime: 0,
        bestMoves: 0,
      },
    };
  }
}

export function saveLevelResult(
  levelId: number,
  timeElapsed: number,
  moves: number,
  earnedStars: number,
  totalLevels: number = 25
): { isNewRecord: boolean; nextLevelUnlocked: boolean } {
  if (typeof window === 'undefined') return { isNewRecord: false, nextLevelUnlocked: false };
  try {
    const progress = getStoredProgress();
    const current = progress[levelId] || {
      levelId,
      unlocked: true,
      completed: false,
      stars: 0,
      bestTime: 0,
      bestMoves: 0,
    };

    const isFirstCompletion = !current.completed;
    const isNewRecord =
      isFirstCompletion ||
      earnedStars > current.stars ||
      (current.bestTime > 0 && timeElapsed < current.bestTime);

    const updatedCurrent: LevelProgress = {
      levelId,
      unlocked: true,
      completed: true,
      stars: Math.max(current.stars, earnedStars),
      bestTime: current.bestTime > 0 ? Math.min(current.bestTime, timeElapsed) : timeElapsed,
      bestMoves: current.bestMoves > 0 ? Math.min(current.bestMoves, moves) : moves,
    };

    progress[levelId] = updatedCurrent;

    // Unlock next level if exists
    let nextLevelUnlocked = false;
    const nextLevelId = levelId + 1;
    if (nextLevelId <= totalLevels) {
      if (!progress[nextLevelId]) {
        progress[nextLevelId] = {
          levelId: nextLevelId,
          unlocked: true,
          completed: false,
          stars: 0,
          bestTime: 0,
          bestMoves: 0,
        };
        nextLevelUnlocked = true;
      } else if (!progress[nextLevelId].unlocked) {
        progress[nextLevelId].unlocked = true;
        nextLevelUnlocked = true;
      }
    }

    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    return { isNewRecord, nextLevelUnlocked };
  } catch (err) {
    console.error('Failed to save level result', err);
    return { isNewRecord: false, nextLevelUnlocked: false };
  }
}

export function getTotalEarnedStars(): number {
  const progress = getStoredProgress();
  return Object.values(progress).reduce((sum, item) => sum + (item.stars || 0), 0);
}
