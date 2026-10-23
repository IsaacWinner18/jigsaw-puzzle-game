import { supabase, isSupabaseConfigured } from './supabase';

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

/**
 * Creates or joins a real-time room channel using Supabase with BroadcastChannel fallback.
 * Strictly operates via network / Supabase sockets with zero browser storage (no localStorage/sessionStorage).
 */
export function subscribeToRoom(
  code: string,
  localPlayer: MultiplayerPlayer,
  handlersOrUpdate: ((state: MultiplayerRoomState) => void) | RoomEventHandlers
): {
  broadcastUpdate: (updatedState: MultiplayerRoomState) => void;
  broadcastAction: (action: 'PLAYER_LEFT' | 'PLAYER_FORFEIT' | 'ROOM_CLOSED', payload?: any) => void;
  unsubscribe: () => void;
} {
  const roomCode = code.toUpperCase();
  const handlers: RoomEventHandlers =
    typeof handlersOrUpdate === 'function'
      ? { onStateUpdate: handlersOrUpdate }
      : handlersOrUpdate;

  let broadcastChannel: BroadcastChannel | null = null;
  let supabaseChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  let latestKnownState: MultiplayerRoomState | null = null;

  const applyUpdate = (incoming: MultiplayerRoomState) => {
    if (!incoming || incoming.code !== roomCode) return;
    latestKnownState = incoming;
    handlers.onStateUpdate(incoming);
  };

  const handleCustomAction = (action: string, payload: any) => {
    if (action === 'PLAYER_LEFT' && payload?.playerId) {
      handlers.onPlayerLeft?.(payload.playerId);
    } else if (action === 'PLAYER_FORFEIT' && payload?.playerId) {
      handlers.onPlayerForfeit?.(payload.playerId);
    } else if (action === 'ROOM_CLOSED') {
      handlers.onRoomClosed?.(payload?.reason);
    }
  };

  // 1. Cross-tab in-memory BroadcastChannel fallback (Zero disk storage)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel('jigsaw_room_bc_' + roomCode);
      broadcastChannel.onmessage = (event) => {
        if (!event.data) return;
        if (event.data.type === 'ACTION') {
          handleCustomAction(event.data.action, event.data.payload);
        } else if (event.data.code === roomCode) {
          applyUpdate(event.data);
        }
      };
    } catch {
      // BroadcastChannel disabled or restricted
    }
  }

  // 2. Supabase Realtime Channel (Authoritative WebSockets across devices and networks)
  if (isSupabaseConfigured && supabase) {
    try {
      const topic = `room:${roomCode}`;
      const realtimeTopic = `realtime:${topic}`;
      const existing = supabase.getChannels().find(
        (ch) => ch.topic === realtimeTopic || ch.topic === topic
      );
      if (existing) {
        try {
          supabase.removeChannel(existing);
        } catch {}
      }

      supabaseChannel = supabase
        .channel(`room:${roomCode}`, {
          config: {
            broadcast: { self: false },
            presence: { key: localPlayer.id },
          },
        })
        .on('broadcast', { event: 'STATE_SYNC' }, (payload) => {
          if (payload?.payload?.code === roomCode) {
            applyUpdate(payload.payload);
          }
        })
        .on('broadcast', { event: 'ACTION' }, (payload) => {
          if (payload?.payload) {
            handleCustomAction(payload.payload.action, payload.payload.payload);
          }
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          // If a new peer connects and we have room state, sync immediately
          if (key !== localPlayer.id && latestKnownState) {
            try {
              supabaseChannel?.send({
                type: 'broadcast',
                event: 'STATE_SYNC',
                payload: latestKnownState,
              });
            } catch {}
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (key && key !== localPlayer.id) {
            handlers.onPresenceLeave?.(key);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            try {
              supabaseChannel?.track({
                id: localPlayer.id,
                name: localPlayer.name,
                isHost: localPlayer.isHost,
                onlineAt: new Date().toISOString(),
              });
            } catch {}

            // Immediately broadcast state once socket is ready
            if (latestKnownState) {
              try {
                supabaseChannel?.send({
                  type: 'broadcast',
                  event: 'STATE_SYNC',
                  payload: latestKnownState,
                });
              } catch {}
            }
          }
        });
    } catch (err) {
      console.error('Failed to initialize Supabase Realtime channel', err);
    }
  }

  // Sender function for room state updates
  const broadcastUpdate = (updatedState: MultiplayerRoomState) => {
    latestKnownState = updatedState;
    handlers.onStateUpdate(updatedState);

    // Send through BroadcastChannel
    try {
      broadcastChannel?.postMessage(updatedState);
    } catch {}

    // Send through Supabase Broadcast
    if (supabaseChannel) {
      try {
        supabaseChannel.send({
          type: 'broadcast',
          event: 'STATE_SYNC',
          payload: updatedState,
        });
      } catch {}
    }
  };

  // Sender function for explicit room lifecycle actions (Exit, Forfeit, Close)
  const broadcastAction = (action: 'PLAYER_LEFT' | 'PLAYER_FORFEIT' | 'ROOM_CLOSED', payload?: any) => {
    try {
      broadcastChannel?.postMessage({ type: 'ACTION', action, payload });
    } catch {}

    if (supabaseChannel) {
      try {
        supabaseChannel.send({
          type: 'broadcast',
          event: 'ACTION',
          payload: { action, payload },
        });
      } catch {}
    }
  };

  const unsubscribe = () => {
    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {}
    }
    if (supabaseChannel && supabase) {
      try {
        supabase.removeChannel(supabaseChannel);
      } catch {}
    }
  };

  return { broadcastUpdate, broadcastAction, unsubscribe };
}
