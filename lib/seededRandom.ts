/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Ensures both players in a multiplayer room generate the exact same
 * puzzle tabs, blank cuts, and initial piece tray scatter coordinates.
 */
export function createPRNG(seed: number = 1337): () => number {
  let s = (seed >>> 0) || 1337;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a clean 6-character alphanumeric room code (e.g. "ATEL42")
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random 6-digit seed integer for room generation
 */
export function generateSeed(): number {
  return Math.floor(100000 + Math.random() * 900000);
}
