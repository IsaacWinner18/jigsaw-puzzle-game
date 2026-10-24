export interface PlayerProfile {
  id: string;
  name: string;
}

// Ephemeral session state with per-tab isolation and cookie fallback
let memoryPlayerId: string | null = null;
let memoryPlayerName: string | null = null;

function getSessionItem(name: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.sessionStorage?.getItem(name);
    if (val) return val;
  } catch {}
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {}
  return null;
}

function setSessionItem(name: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.setItem(name, value);
  } catch {}
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  } catch {}
}

/**
 * Generates a collision-resistant unique ID for this session.
 */
function generateUniqueId(): string {
  const rand = Math.random().toString(36).substring(2, 8);
  const time = Date.now().toString(36).substring(4);
  return `usr_${rand}${time}`;
}

/**
 * Returns a unique player ID and real chosen display name.
 * Respects real Passizy student profile when available, or maintains an in-memory session.
 * Scoped per tab so multiple tabs on the same machine do not collide.
 */
export function getPlayerProfile(studentProfile?: { id?: string; name?: string } | null): PlayerProfile {
  if (typeof window === 'undefined') {
    return { id: 'usr_server', name: 'Player' };
  }

  // Persist Passizy identity onto session storage so create-room and join-room
  // use the same player id even before the SDK finishes loading on the next page.
  if (studentProfile?.id) {
    memoryPlayerId = studentProfile.id;
    setSessionItem('jigsaw_session_player_id', memoryPlayerId);
    if (studentProfile.name) {
      memoryPlayerName = studentProfile.name;
      setSessionItem('jigsaw_session_player_name', memoryPlayerName);
    }
  }

  if (!memoryPlayerId) {
    memoryPlayerId = getSessionItem('jigsaw_session_player_id') || generateUniqueId();
    setSessionItem('jigsaw_session_player_id', memoryPlayerId);
  }

  if (!memoryPlayerName) {
    const savedName = getSessionItem('jigsaw_session_player_name');
    if (savedName) {
      memoryPlayerName = savedName;
    } else {
      const shortCode = memoryPlayerId.replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase();
      memoryPlayerName = `Challenger #${shortCode}`;
      setSessionItem('jigsaw_session_player_name', memoryPlayerName);
    }
  }

  return { id: memoryPlayerId, name: memoryPlayerName };
}

/**
 * Updates the user's competitor name in memory and session storage
 */
export function savePlayerName(name: string): string {
  const clean = name.trim().slice(0, 20);
  if (clean) {
    memoryPlayerName = clean;
    setSessionItem('jigsaw_session_player_name', clean);
    return clean;
  }
  return memoryPlayerName || 'Challenger';
}


