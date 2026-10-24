export interface MultiplayerPlayer {
  id: string;
  name: string;
  department?: string;
  avatarSeed?: number;
  isHost: boolean;
  piecesLocked: number;
  totalPieces: number;
  completedAt?: number;
  elapsedSeconds?: number;
  status: 'ready' | 'playing' | 'finished' | 'forfeited' | 'left';
}

export interface MultiplayerRoomState {
  code: string;
  hostId: string;
  puzzleId: string;
  difficulty: 'Beginner' | 'Artisan' | 'Master' | 'Grandmaster';
  rows: number;
  cols: number;
  seed: number;
  status: 'waiting' | 'countdown' | 'playing' | 'finished' | 'closed';
  countdownValue?: number;
  startedAt?: number;
  players: Record<string, MultiplayerPlayer>;
  winnerId?: string;
  winnerName?: string;
  closedReason?: string;
}

export interface RoomEventHandlers {
  onStateUpdate: (state: MultiplayerRoomState) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayerForfeit?: (playerId: string) => void;
  onRoomClosed?: (reason?: string) => void;
  onPresenceLeave?: (playerId: string) => void;
}

export function subscribeToRoom(
  _code: string,
  _localPlayer: MultiplayerPlayer,
  handlersOrUpdate: ((state: MultiplayerRoomState) => void) | RoomEventHandlers
): {
  broadcastUpdate: (updatedState: MultiplayerRoomState) => void;
  broadcastAction: (action: 'PLAYER_LEFT' | 'PLAYER_FORFEIT' | 'ROOM_CLOSED', payload?: unknown) => void;
  unsubscribe: () => void;
} {
  const handlers: RoomEventHandlers =
    typeof handlersOrUpdate === 'function' ? { onStateUpdate: handlersOrUpdate } : handlersOrUpdate;

  return {
    broadcastUpdate: handlers.onStateUpdate,
    broadcastAction: () => {},
    unsubscribe: () => {},
  };
}
