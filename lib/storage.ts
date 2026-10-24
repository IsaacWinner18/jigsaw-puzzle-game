import { LevelProgress } from '../types/puzzle';

const STORAGE_KEY_PROGRESS = 'jigsaw_atelier_campaign_progress_v1';

export function getScopedStorageKey(studentId?: string | null): string {
  if (studentId && typeof studentId === 'string' && studentId.trim().length > 0) {
    return `jigsaw_progress_${studentId.trim()}`;
  }
  return STORAGE_KEY_PROGRESS;
}

/**
 * Merges two progress snapshots without losing any unlocked levels, stars, or records.
 */
export function mergeCampaignProgress(
  local: Record<number, LevelProgress> = {},
  remote: Record<number, LevelProgress> = {}
): Record<number, LevelProgress> {
  const merged: Record<number, LevelProgress> = { ...local };
  const allKeys = new Set([
    ...Object.keys(local).map(Number),
    ...Object.keys(remote).map(Number),
    1,
  ]);

  for (const id of allKeys) {
    const l = local[id];
    const r = remote[id];

    if (!l && r) {
      merged[id] = { ...r };
      continue;
    }
    if (l && !r) {
      merged[id] = { ...l };
      continue;
    }
    if (l && r) {
      const isCompleted = Boolean(l.completed || r.completed);
      const isUnlocked = Boolean(l.unlocked || r.unlocked || id === 1);
      const stars = Math.max(l.stars || 0, r.stars || 0);

      const bestTime =
        l.bestTime > 0 && r.bestTime > 0
          ? Math.min(l.bestTime, r.bestTime)
          : l.bestTime > 0
          ? l.bestTime
          : r.bestTime;

      const bestMoves =
        l.bestMoves > 0 && r.bestMoves > 0
          ? Math.min(l.bestMoves, r.bestMoves)
          : l.bestMoves > 0
          ? l.bestMoves
          : r.bestMoves;

      merged[id] = {
        levelId: id,
        unlocked: isUnlocked,
        completed: isCompleted,
        stars,
        bestTime,
        bestMoves,
      };
    }
  }

  // Ensure Level 1 is always unlocked
  if (!merged[1]) {
    merged[1] = {
      levelId: 1,
      unlocked: true,
      completed: false,
      stars: 0,
      bestTime: 0,
      bestMoves: 0,
    };
  } else {
    merged[1].unlocked = true;
  }

  return merged;
}

export function getStoredProgress(studentId?: string | null): Record<number, LevelProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const scopedKey = getScopedStorageKey(studentId);
    let data = localStorage.getItem(scopedKey);

    // If scoped key is empty but we have legacy progress, import legacy
    if (!data && scopedKey !== STORAGE_KEY_PROGRESS) {
      const legacyData = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (legacyData) {
        data = legacyData;
        try {
          localStorage.setItem(scopedKey, legacyData);
        } catch {}
      }
    }

    if (!data) {
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
      try {
        localStorage.setItem(scopedKey, JSON.stringify(initial));
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(initial));
      } catch {}
      return initial;
    }

    const parsed = JSON.parse(data);
    return mergeCampaignProgress(parsed, {});
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

export function saveStoredProgressLocally(
  progress: Record<number, LevelProgress>,
  studentId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(progress);
    const scopedKey = getScopedStorageKey(studentId);
    localStorage.setItem(scopedKey, serialized);
    if (scopedKey !== STORAGE_KEY_PROGRESS) {
      localStorage.setItem(STORAGE_KEY_PROGRESS, serialized);
    }
  } catch (err) {
    console.error('Failed to write campaign progress to localStorage', err);
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    try {
      const token =
        window.Passizy?.auth?.token ||
        new URLSearchParams(window.location.search).get('passizy_token') ||
        '';
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
  }
  return headers;
}

/**
 * Persists campaign progress to Supabase database (primary) and Passizy storage in background.
 */
export async function persistToCloud(
  progress: Record<number, LevelProgress>,
  studentId?: string | null
): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Primary: Save to Supabase backend API with Passizy authentication
  try {
    await fetch('/api/campaign/progress', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        studentId: studentId || null,
        progress,
      }),
    });
  } catch (err) {
    console.warn('[Supabase Sync Warning]', err);
  }

  // 2. Secondary: Mirror to Passizy Mini-App Cloud Storage bridge if available
  try {
    if (window.Passizy?.storage) {
      await window.Passizy.storage.set('campaign_progress', progress);
    }
  } catch (e) {
    console.warn('[Passizy Storage Mirror Notice]', e);
  }
}

/**
 * Loads cloud progress from Supabase database (primary) and merges it with local storage.
 */
export async function syncCloudProgress(
  studentId?: string | null
): Promise<Record<number, LevelProgress>> {
  const local = getStoredProgress(studentId);
  if (typeof window === 'undefined') return local;

  let remoteProgress: Record<number, LevelProgress> | null = null;

  // 1. Primary: Fetch from Supabase backend database via /api/campaign/progress
  try {
    const queryParam = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    const res = await fetch(`/api/campaign/progress${queryParam}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.progress && typeof data.progress === 'object' && Object.keys(data.progress).length > 0) {
        remoteProgress = data.progress;
      }
    }
  } catch (err) {
    console.warn('[Supabase Progress Fetch Notice]', err);
  }

  // 2. Secondary: Fallback to Passizy Cloud Storage if Supabase has not yet seen this student
  if (!remoteProgress) {
    try {
      if (window.Passizy?.storage) {
        const cloudData = await window.Passizy.storage.get<Record<number, LevelProgress>>('campaign_progress');
        if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
          remoteProgress = cloudData;
        }
      }
    } catch (e) {
      console.warn('[Passizy Cloud Fetch Notice]', e);
    }
  }

  if (remoteProgress) {
    const merged = mergeCampaignProgress(local, remoteProgress);
    saveStoredProgressLocally(merged, studentId);
    return merged;
  }

  return local;
}

export function saveLevelResult(
  levelId: number,
  timeElapsed: number,
  moves: number,
  earnedStars: number,
  totalLevels: number = 25,
  studentId?: string | null
): { isNewRecord: boolean; nextLevelUnlocked: boolean; updatedProgress: Record<number, LevelProgress> } {
  if (typeof window === 'undefined') {
    return { isNewRecord: false, nextLevelUnlocked: false, updatedProgress: {} };
  }
  try {
    const progress = getStoredProgress(studentId);
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

    saveStoredProgressLocally(progress, studentId);
    persistToCloud(progress, studentId);

    return { isNewRecord, nextLevelUnlocked, updatedProgress: progress };
  } catch (err) {
    console.error('Failed to save level result', err);
    return { isNewRecord: false, nextLevelUnlocked: false, updatedProgress: {} };
  }
}

export function getTotalEarnedStars(studentId?: string | null): number {
  const progress = getStoredProgress(studentId);
  return Object.values(progress).reduce((sum, item) => sum + (item.stars || 0), 0);
}
