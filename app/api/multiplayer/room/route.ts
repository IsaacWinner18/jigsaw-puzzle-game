import { NextRequest, NextResponse } from 'next/server';
import { generateRoomCode, generateSeed } from '@/lib/seededRandom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// In-memory cache for fast local access / fallback
const activeRooms = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, hostId, hostName, puzzleId, difficulty, rows, cols } = body;

    if (action === 'create') {
      const roomCode = code || generateRoomCode();
      const seed = generateSeed();

      const newRoom = {
        code: roomCode,
        hostId,
        puzzleId: puzzleId || 'tom-jerry',
        difficulty: difficulty || 'Beginner',
        rows: rows || 3,
        cols: cols || 3,
        seed,
        status: 'waiting',
        createdAt: Date.now(),
        players: {
          [hostId]: {
            id: hostId,
            name: hostName || 'Host Player',
            isHost: true,
            piecesLocked: 0,
            totalPieces: (rows || 3) * (cols || 3),
            status: 'ready',
          },
        },
      };

      activeRooms.set(roomCode, newRoom);

      // Persist to Supabase Database if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('rooms').insert({
            code: roomCode,
            host_id: hostId,
            puzzle_id: puzzleId || 'tom-jerry',
            difficulty: difficulty || 'Beginner',
            rows: rows || 3,
            cols: cols || 3,
            seed,
            status: 'waiting',
          });

          await supabase.from('room_players').insert({
            room_code: roomCode,
            player_id: hostId,
            name: hostName || 'Host Player',
            is_host: true,
            pieces_locked: 0,
            total_pieces: (rows || 3) * (cols || 3),
            status: 'ready',
          });
        } catch (dbErr) {
          console.error('[Supabase DB Error] Room create insert:', dbErr);
        }
      }

      return NextResponse.json({ success: true, room: newRoom });
    }

    if (action === 'get') {
      const roomCode = String(code).toUpperCase();

      // Check Supabase Database first if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbRoom } = await supabase
            .from('rooms')
            .select('*, room_players(*)')
            .eq('code', roomCode)
            .single();

          if (dbRoom) {
            const playersMap: Record<string, any> = {};
            (dbRoom.room_players || []).forEach((p: any) => {
              playersMap[p.player_id] = {
                id: p.player_id,
                name: p.name,
                department: p.department,
                isHost: p.is_host,
                piecesLocked: p.pieces_locked,
                totalPieces: p.total_pieces,
                status: p.status,
              };
            });

            const formattedRoom = {
              code: dbRoom.code,
              hostId: dbRoom.host_id,
              puzzleId: dbRoom.puzzle_id,
              difficulty: dbRoom.difficulty,
              rows: dbRoom.rows,
              cols: dbRoom.cols,
              seed: Number(dbRoom.seed),
              status: dbRoom.status,
              createdAt: new Date(dbRoom.created_at).getTime(),
              players: playersMap,
            };
            activeRooms.set(roomCode, formattedRoom);
            return NextResponse.json({ success: true, room: formattedRoom });
          }
        } catch (dbErr) {
          console.error('[Supabase DB Error] Room lookup:', dbErr);
        }
      }

      // Fallback to active memory cache
      const room = activeRooms.get(roomCode);
      if (!room) {
        return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, room });
    }

    if (action === 'join') {
      const roomCode = String(code).toUpperCase();
      const { player } = body;

      // 1. Check Supabase DB first
      let currentRoom = activeRooms.get(roomCode);
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbRoom } = await supabase
            .from('rooms')
            .select('*, room_players(*)')
            .eq('code', roomCode)
            .single();

          if (dbRoom) {
            const playersMap: Record<string, any> = {};
            (dbRoom.room_players || []).forEach((p: any) => {
              playersMap[p.player_id] = {
                id: p.player_id,
                name: p.name,
                department: p.department,
                isHost: p.is_host,
                piecesLocked: p.pieces_locked,
                totalPieces: p.total_pieces,
                status: p.status,
              };
            });
            currentRoom = {
              code: dbRoom.code,
              hostId: dbRoom.host_id,
              puzzleId: dbRoom.puzzle_id,
              difficulty: dbRoom.difficulty,
              rows: dbRoom.rows,
              cols: dbRoom.cols,
              seed: Number(dbRoom.seed),
              status: dbRoom.status,
              createdAt: new Date(dbRoom.created_at).getTime(),
              players: playersMap,
            };
            activeRooms.set(roomCode, currentRoom);
          }
        } catch (dbErr) {
          console.error('[Supabase DB Error] Room lookup in join:', dbErr);
        }
      }

      if (!currentRoom) {
        return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
      }

      // Check room status condition
      if (currentRoom.status === 'closed') {
        return NextResponse.json({ success: false, error: 'This room was closed by the host' }, { status: 400 });
      }

      if (currentRoom.status === 'finished') {
        return NextResponse.json({ success: false, error: 'This match has already ended' }, { status: 400 });
      }

      const existingPlayerIds = Object.keys(currentRoom.players || {});
      const isAlreadyInRoom = player?.id && existingPlayerIds.includes(player.id);

      // Check if room is in active battle
      if ((currentRoom.status === 'playing' || currentRoom.status === 'countdown') && !isAlreadyInRoom) {
        return NextResponse.json({ success: false, error: 'Match is already in progress' }, { status: 403 });
      }

      // Check 1v1 capacity limit (max 2 players)
      if (currentRoom.status === 'waiting' && !isAlreadyInRoom && existingPlayerIds.length >= 2) {
        return NextResponse.json({ success: false, error: 'Room is full (1v1 battle limit reached)' }, { status: 409 });
      }

      if (player && player.id) {
        currentRoom.players[player.id] = player;
        activeRooms.set(roomCode, currentRoom);
      }

      // Persist joined player to Supabase DB
      if (isSupabaseConfigured && supabase && player && player.id) {
        try {
          await supabase.from('room_players').upsert({
            room_code: roomCode,
            player_id: player.id,
            name: player.name,
            department: player.department,
            is_host: Boolean(player.isHost),
            pieces_locked: player.piecesLocked || 0,
            total_pieces: player.totalPieces || (currentRoom.rows * currentRoom.cols),
            status: player.status || 'ready',
          });
        } catch (dbErr) {
          console.error('[Supabase DB Error] Room player join:', dbErr);
        }
      }

      return NextResponse.json({ success: true, room: currentRoom });
    }

    if (action === 'leave') {
      const roomCode = String(code).toUpperCase();
      const { playerId } = body;
      const room = activeRooms.get(roomCode);

      if (room && playerId) {
        // If host leaves: mark room as closed
        if (room.hostId === playerId) {
          room.status = 'closed';
          activeRooms.delete(roomCode);

          if (isSupabaseConfigured && supabase) {
            try {
              await supabase.from('rooms').update({ status: 'closed' }).eq('code', roomCode);
              await supabase.from('rooms').delete().eq('code', roomCode);
            } catch (dbErr) {
              console.error('[Supabase DB Error] Host room close:', dbErr);
            }
          }

          return NextResponse.json({ success: true, roomClosed: true });
        }

        // If guest leaves: remove from player roster
        delete room.players[playerId];
        activeRooms.set(roomCode, room);

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from('room_players')
              .delete()
              .eq('room_code', roomCode)
              .eq('player_id', playerId);
          } catch (dbErr) {
            console.error('[Supabase DB Error] Guest leave:', dbErr);
          }
        }

        return NextResponse.json({ success: true, room });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'forfeit') {
      const roomCode = String(code).toUpperCase();
      const { playerId } = body;
      const room = activeRooms.get(roomCode);

      if (room && playerId) {
        // Find opponent (the winner)
        const opponent = Object.values(room.players || {}).find((p: any) => p.id !== playerId) as any;
        const winnerId = opponent ? opponent.id : null;
        const winnerName = opponent ? opponent.name : 'Opponent';

        room.status = 'finished';
        room.winnerId = winnerId;
        room.winnerName = winnerName;

        if (room.players[playerId]) {
          room.players[playerId].status = 'forfeited';
        }

        activeRooms.set(roomCode, room);

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from('rooms')
              .update({
                status: 'finished',
                winner_id: winnerId,
                winner_name: winnerName,
              })
              .eq('code', roomCode);

            await supabase
              .from('room_players')
              .update({ status: 'forfeited' })
              .eq('room_code', roomCode)
              .eq('player_id', playerId);
          } catch (dbErr) {
            console.error('[Supabase DB Error] Forfeit update:', dbErr);
          }
        }

        return NextResponse.json({ success: true, room, winnerId, winnerName });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'update') {
      const roomCode = String(code).toUpperCase();
      if (body.room) {
        activeRooms.set(roomCode, body.room);

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from('rooms')
              .update({
                status: body.room.status,
                winner_id: body.room.winnerId,
                winner_name: body.room.winnerName,
              })
              .eq('code', roomCode);
          } catch (dbErr) {
            console.error('[Supabase DB Error] Room update:', dbErr);
          }
        }

        return NextResponse.json({ success: true, room: body.room });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
