export interface PlayerProfile {
  id: string;
  name: string;
}

// Ephemeral session state with cookie transport (Zero localStorage / sessionStorage)
let memoryPlayerId: string | null = null;
let memoryPlayerName: string | null = null;

function getSessionCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setSessionCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  // Browser session cookie (cleared when browser session ends)
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
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
 * Completely free of localStorage and sessionStorage.
 */
export function getPlayerProfile(studentProfile?: { id?: string; name?: string } | null): PlayerProfile {
  if (typeof window === 'undefined') {
    return { id: 'usr_server', name: 'Player' };
  }

  // Persist Passizy identity onto the session cookie so create-room and join-room
  // use the same player id even before the SDK finishes loading on the next page.
  if (studentProfile?.id) {
    memoryPlayerId = studentProfile.id;
    setSessionCookie('jigsaw_session_player_id', memoryPlayerId);
    if (studentProfile.name) {
      memoryPlayerName = studentProfile.name;
      setSessionCookie('jigsaw_session_player_name', memoryPlayerName);
    }
  }

  if (!memoryPlayerId) {
    memoryPlayerId = getSessionCookie('jigsaw_session_player_id') || generateUniqueId();
    setSessionCookie('jigsaw_session_player_id', memoryPlayerId);
  }

  if (!memoryPlayerName) {
    const savedName = getSessionCookie('jigsaw_session_player_name');
    if (savedName) {
      memoryPlayerName = savedName;
    } else {
      const shortCode = memoryPlayerId.replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase();
      memoryPlayerName = `Challenger #${shortCode}`;
      setSessionCookie('jigsaw_session_player_name', memoryPlayerName);
    }
  }

  return { id: memoryPlayerId, name: memoryPlayerName };
}

/**
 * Updates the user's competitor name in memory and session cookie
 */
export function savePlayerName(name: string): string {
  const clean = name.trim().slice(0, 20);
  if (clean) {
    memoryPlayerName = clean;
    setSessionCookie('jigsaw_session_player_name', clean);
    return clean;
  }
  return memoryPlayerName || 'Challenger';
}


