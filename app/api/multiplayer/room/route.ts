import { NextRequest, NextResponse } from 'next/server';
import { generateRoomCode, generateSeed } from '@/lib/seededRandom';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { MultiplayerRoomState } from '@/lib/multiplayerStore';
import {
  clearOtherRoomCapabilities,
  clearRoomCapability,
  getRoomCapability,
  isMultiplayerAuthConfigured,
  setRoomCapability,
} from '@/lib/multiplayerAuth';

const activeRooms = new Map<string, MultiplayerRoomState>();
const database = supabaseAdmin;
const roomCodePattern = /^[A-Z0-9]{4,8}$/;

function error(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeCode(value: unknown) {
  const code = String(value || '').trim().toUpperCase();
  return roomCodePattern.test(code) ? code : null;
}

function normalizeName(value: unknown) {
  const name = String(value || '').trim().slice(0, 20);
  return name || 'Challenger';
}

function normalizeGrid(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 2 && number <= 12 ? number : fallback;
}

function requireMutationBackend() {
  if (isSupabaseConfigured && !database) {
    return error('Multiplayer server storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY.', 503);
  }
  if (process.env.NODE_ENV === 'production' && !database) {
    return error('Multiplayer server storage is not configured.', 503);
  }
  return null;
}

function formatRoom(room: any): MultiplayerRoomState {
  const players: MultiplayerRoomState['players'] = {};
  for (const player of room.room_players || []) {
    players[player.player_id] = {
      id: player.player_id,
      name: player.name,
      department: player.department || undefined,
      isHost: player.is_host,
      piecesLocked: player.pieces_locked,
      totalPieces: player.total_pieces,
      status: player.status,
    };
  }
  return {
    code: room.code,
    hostId: room.host_id,
    puzzleId: room.puzzle_id,
    difficulty: room.difficulty,
    rows: room.rows,
    cols: room.cols,
    seed: Number(room.seed),
    status: room.status,
    startedAt: room.started_at ? new Date(room.started_at).getTime() : undefined,
    winnerId: room.winner_id || undefined,
    winnerName: room.winner_name || undefined,
    players,
  };
}

async function loadRoom(code: string) {
  if (database) {
    const { data, error: lookupError } = await database
      .from('rooms')
      .select('*, room_players(*)')
      .eq('code', code)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!data) return null;
    const room = formatRoom(data);
    activeRooms.set(code, room);
    return room;
  }
  return activeRooms.get(code) || null;
}

function responseWithCapability(
  request: NextRequest,
  room: MultiplayerRoomState,
  playerId: string
) {
  const response = NextResponse.json({ success: true, room });
  clearOtherRoomCapabilities(request, response, room.code);
  setRoomCapability(response, {
    code: room.code,
    playerId,
    role: room.hostId === playerId ? 'host' : 'player',
  });
  return response;
}

async function disconnectPlayerFromOtherRooms(playerId: string, exceptCode?: string) {
  const closeStatuses = ['waiting', 'countdown', 'playing'];

  if (database) {
    const { data: memberships } = await database
      .from('room_players')
      .select('room_code, is_host')
      .eq('player_id', playerId);
    if (!memberships?.length) return;

    const codes = memberships
      .map((row) => row.room_code)
      .filter((code) => code && code !== exceptCode);
    if (!codes.length) return;

    const { data: rooms } = await database
      .from('rooms')
      .select('code, host_id, status')
      .in('code', codes);
    if (!rooms?.length) return;

    for (const other of rooms) {
      if (!closeStatuses.includes(other.status)) continue;
      const membership = memberships.find((row) => row.room_code === other.code);
      const isHost = membership?.is_host || other.host_id === playerId;

      if (other.status === 'playing' && !isHost) {
        const { data: roster } = await database
          .from('room_players')
          .select('player_id, name')
          .eq('room_code', other.code);
        const opponent = (roster || []).find((player) => player.player_id !== playerId);
        await database
          .from('rooms')
          .update({
            status: 'finished',
            winner_id: opponent?.player_id || null,
            winner_name: opponent?.name || 'Opponent',
          })
          .eq('code', other.code)
          .neq('status', 'finished');
        await database
          .from('room_players')
          .update({ status: 'forfeited' })
          .eq('room_code', other.code)
          .eq('player_id', playerId);
      } else if (isHost) {
        await database.from('rooms').update({ status: 'closed' }).eq('code', other.code);
      } else {
        await database.from('room_players').delete().eq('room_code', other.code).eq('player_id', playerId);
      }
      activeRooms.delete(other.code);
    }
    return;
  }

  for (const [code, room] of activeRooms) {
    if (exceptCode && code === exceptCode) continue;
    if (!closeStatuses.includes(room.status) || !room.players[playerId]) continue;
    if (room.status === 'playing' && room.hostId !== playerId) {
      const opponent = Object.values(room.players).find((player) => player.id !== playerId);
      room.status = 'finished';
      room.winnerId = opponent?.id;
      room.winnerName = opponent?.name || 'Opponent';
      room.players[playerId] = { ...room.players[playerId], status: 'forfeited' };
      activeRooms.set(code, room);
      continue;
    }
    if (room.hostId === playerId) {
      room.status = 'closed';
      activeRooms.set(code, room);
      continue;
    }
    delete room.players[playerId];
    activeRooms.set(code, room);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || '');

    if (!isMultiplayerAuthConfigured) {
      return error('Multiplayer is not configured. Set MULTIPLAYER_TOKEN_SECRET on the server.', 503);
    }

    if (action === 'create') {
      const configurationError = requireMutationBackend();
      if (configurationError) return configurationError;

      const roomCode = normalizeCode(body.code) || generateRoomCode();
      const hostId = String(body.hostId || '').trim();
      if (!hostId || hostId.length > 128) return error('Invalid host identity.', 400);

      const rows = normalizeGrid(body.rows, 3);
      const cols = normalizeGrid(body.cols, 3);
      const hostName = normalizeName(body.hostName);
      const seed = generateSeed();
      const puzzleId = String(body.puzzleId || 'tom-jerry').slice(0, 80);
      const difficulty = String(body.difficulty || 'Beginner').slice(0, 32);

      if (database) {
        const { error: createError } = await database.rpc('create_multiplayer_room', {
          p_code: roomCode,
          p_host_id: hostId,
          p_host_name: hostName,
          p_puzzle_id: puzzleId,
          p_difficulty: difficulty,
          p_rows: rows,
          p_cols: cols,
          p_seed: seed,
        });
        if (createError) return error('Unable to create the room. Please try again.', 503);
      }

      await disconnectPlayerFromOtherRooms(hostId, roomCode);

      const room: MultiplayerRoomState = {
        code: roomCode,
        hostId,
        puzzleId,
        difficulty: difficulty as MultiplayerRoomState['difficulty'],
        rows,
        cols,
        seed,
        status: 'waiting',
        players: {
          [hostId]: {
            id: hostId,
            name: hostName,
            isHost: true,
            piecesLocked: 0,
            totalPieces: rows * cols,
            status: 'ready',
          },
        },
      };
      activeRooms.set(roomCode, room);
      return responseWithCapability(req, room, hostId);
    }

    const roomCode = normalizeCode(body.code);
    if (!roomCode) return error('Invalid room code.', 400);

    if (action === 'get') {
      const room = database ? await loadRoom(roomCode) : activeRooms.get(roomCode);
      return room ? NextResponse.json({ success: true, room }) : error('Room not found.', 404);
    }

    if (action === 'join') {
      const configurationError = requireMutationBackend();
      if (configurationError) return configurationError;
      const requestedPlayer = body.player;
      const playerId = String(requestedPlayer?.id || '').trim();
      if (!playerId || playerId.length > 128) return error('Invalid player identity.', 400);

      const room = await loadRoom(roomCode);
      if (!room) return error('Room not found.', 404);
      const capability = getRoomCapability(req, roomCode);
      const existingPlayer = room.players[playerId];
      if (capability && capability.playerId !== playerId) {
        return error("You're already connected to this room.", 403);
      }
      if (room.status !== 'waiting' && !existingPlayer) return error('This match is already in progress.', 403);
      if (!existingPlayer && Object.keys(room.players).length >= 2) return error('This room is full.', 409);

      await disconnectPlayerFromOtherRooms(playerId, roomCode);

      const player = {
        id: playerId,
        name: normalizeName(requestedPlayer?.name),
        department: typeof requestedPlayer?.department === 'string' ? requestedPlayer.department.slice(0, 80) : undefined,
        isHost: room.hostId === playerId,
        piecesLocked: existingPlayer?.piecesLocked || 0,
        totalPieces: room.rows * room.cols,
        status: existingPlayer?.status || 'ready',
      } as const;

      if (database) {
        const { error: joinError } = await database.from('room_players').upsert({
          room_code: roomCode,
          player_id: player.id,
          name: player.name,
          department: player.department,
          is_host: player.isHost,
          pieces_locked: player.piecesLocked,
          total_pieces: player.totalPieces,
          status: player.status,
        }, { onConflict: 'room_code,player_id' });
        if (joinError) return error(joinError.message === 'Room is full' ? 'Room is full.' : 'Unable to join the room.', 409);
      }

      room.players[playerId] = player;
      activeRooms.set(roomCode, room);
      return responseWithCapability(req, room, playerId);
    }

    const configurationError = requireMutationBackend();
    if (configurationError) return configurationError;
    const capability = getRoomCapability(req, roomCode);
    if (!capability) return error('Your room session has expired. Rejoin the room to continue.', 401);
    const room = await loadRoom(roomCode);
    if (!room) return error('Room not found.', 404);
    const playerId = capability.playerId;
    if (!room.players[playerId]) return error('Player is not registered in this room.', 403);

    if (action === 'leave') {
      if (playerId === room.hostId) {
        if (database) {
          const { error: closeError } = await database.from('rooms').update({ status: 'closed' }).eq('code', roomCode).eq('host_id', playerId);
          if (closeError) return error('Unable to close the room.', 503);
        }
        room.status = 'closed';
        activeRooms.set(roomCode, room);
        const closed = NextResponse.json({ success: true, roomClosed: true });
        clearRoomCapability(closed, roomCode);
        return closed;
      }
      if (database) {
        const { error: leaveError } = await database.from('room_players').delete().eq('room_code', roomCode).eq('player_id', playerId);
        if (leaveError) return error('Unable to leave the room.', 503);
      }
      delete room.players[playerId];
      activeRooms.set(roomCode, room);
      const left = NextResponse.json({ success: true });
      clearRoomCapability(left, roomCode);
      return left;
    }

    if (action === 'forfeit') {
      const opponent = Object.values(room.players).find((player) => player.id !== playerId);
      if (database) {
        const { error: forfeitError } = await database
          .from('rooms')
          .update({ status: 'finished', winner_id: opponent?.id || null, winner_name: opponent?.name || 'Opponent' })
          .eq('code', roomCode)
          .neq('status', 'finished');
        if (forfeitError) return error('Unable to forfeit the match.', 503);
        await database.from('room_players').update({ status: 'forfeited' }).eq('room_code', roomCode).eq('player_id', playerId);
      }
      room.status = 'finished';
      room.winnerId = opponent?.id;
      room.winnerName = opponent?.name || 'Opponent';
      room.players[playerId] = { ...room.players[playerId], status: 'forfeited' };
      activeRooms.set(roomCode, room);
      const forfeited = NextResponse.json({ success: true, room });
      clearRoomCapability(forfeited, roomCode);
      return forfeited;
    }

    if (action === 'countdown' || action === 'start') {
      if (capability.role !== 'host' || playerId !== room.hostId) return error('Only the host can start the match.', 403);
      const nextStatus = action === 'countdown' ? 'countdown' : 'playing';
      const allowedStatus = action === 'countdown' ? 'waiting' : 'countdown';
      if (room.status !== allowedStatus) return error('The match cannot transition from its current state.', 409);
      const startedAt = new Date().toISOString();
      if (database) {
        const { data, error: startError } = await database
          .from('rooms')
          .update({ status: nextStatus, started_at: startedAt })
          .eq('code', roomCode)
          .eq('host_id', playerId)
          .eq('status', allowedStatus)
          .select('code')
          .maybeSingle();
        if (startError || !data) return error('Unable to start the match.', 409);
      }
      room.status = nextStatus;
      room.startedAt = new Date(startedAt).getTime();
      activeRooms.set(roomCode, room);
      return NextResponse.json({ success: true, room });
    }

    if (action === 'progress') {
      const piecesLocked = Number(body.piecesLocked);
      const totalPieces = room.rows * room.cols;
      if (!Number.isInteger(piecesLocked) || piecesLocked < 0 || piecesLocked > totalPieces) {
        return error('Invalid puzzle progress.', 400);
      }
      if (database) {
        const { error: progressError } = await database
          .from('room_players')
          .update({ pieces_locked: piecesLocked, status: 'playing' })
          .eq('room_code', roomCode)
          .eq('player_id', playerId);
        if (progressError) return error('Unable to save puzzle progress.', 503);
      }
      room.players[playerId] = { ...room.players[playerId], piecesLocked, status: 'playing' };
      activeRooms.set(roomCode, room);
      return NextResponse.json({ success: true });
    }

    return error('Invalid action.', 400);
  } catch (exception) {
    console.error('[Multiplayer Room Error]', exception);
    return error('Unable to process the room request.', 500);
  }
}
