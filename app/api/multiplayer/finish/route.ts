import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getRoomCapability } from '@/lib/multiplayerAuth';

interface RoomResult {
  code: string;
  winnerId: string;
  winnerName: string;
  finishedAt: number;
  elapsedSeconds: number;
}

const finishedRooms = new Map<string, RoomResult>();
const database = supabaseAdmin;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, playerId, elapsedSeconds } = body;

    if (!roomCode || !playerId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const code = String(roomCode).toUpperCase();
    const capability = getRoomCapability(req, code, body.token);
    if (!capability || capability.playerId !== playerId) {
      return NextResponse.json({ error: 'Your room session has expired. Rejoin the room to continue.' }, { status: 401 });
    }
    const finishedAt = Date.now();

    if ((isSupabaseConfigured || process.env.NODE_ENV === 'production') && !database) {
      return NextResponse.json({ error: 'Multiplayer server storage is not configured.' }, { status: 503 });
    }

    // Check Supabase if configured for persistent race verification
    if (isSupabaseConfigured && database) {
      try {
        const { data: player } = await database
          .from('room_players')
          .select('player_id, name')
          .eq('room_code', code)
          .eq('player_id', playerId)
          .maybeSingle();
        if (!player) {
          return NextResponse.json({ error: 'Player is not registered in this room.' }, { status: 403 });
        }
        const verifiedPlayerName = player.name || 'Player';

        const { data: existingWinners } = await database
          .from('race_results')
          .select('*')
          .eq('room_code', code)
          .eq('is_winner', true)
          .limit(1);

        const hasDbWinner = existingWinners && existingWinners.length > 0;
        const isDbWinner = !hasDbWinner;

        const { error: resultError } = await database.from('race_results').insert({
          room_code: code,
          player_id: playerId,
          player_name: verifiedPlayerName,
          elapsed_seconds: elapsedSeconds || 0,
          is_winner: isDbWinner,
        });
        if (resultError) {
          const { data: winner } = await database
            .from('race_results')
            .select('*')
            .eq('room_code', code)
            .eq('is_winner', true)
            .single();
          if (!winner) throw resultError;
          return NextResponse.json({
            success: true,
            isWinner: winner.player_id === playerId,
            winner: {
              code,
              winnerId: winner.player_id,
              winnerName: winner.player_name,
              finishedAt: new Date(winner.finished_at).getTime(),
              elapsedSeconds: Number(winner.elapsed_seconds),
            },
          });
        }

        const officialWinner: RoomResult = hasDbWinner
          ? {
              code,
              winnerId: existingWinners[0].player_id,
              winnerName: existingWinners[0].player_name,
              finishedAt: new Date(existingWinners[0].finished_at).getTime(),
              elapsedSeconds: Number(existingWinners[0].elapsed_seconds),
            }
          : {
              code,
              winnerId: playerId,
            winnerName: verifiedPlayerName,
              finishedAt,
              elapsedSeconds: elapsedSeconds || 0,
            };

        return NextResponse.json({
          success: true,
          isWinner: officialWinner.winnerId === playerId,
          winner: officialWinner,
        });
      } catch (dbErr) {
        console.error('[Supabase DB Error] Finish logging:', dbErr);
        return NextResponse.json({ error: 'Unable to verify the winner.' }, { status: 503 });
      }
    }

    // In-memory fallback
    if (!finishedRooms.has(code)) {
      const winnerResult: RoomResult = {
        code,
        winnerId: playerId,
        winnerName: 'Player',
        finishedAt,
        elapsedSeconds: elapsedSeconds || 0,
      };
      finishedRooms.set(code, winnerResult);

      return NextResponse.json({
        success: true,
        isWinner: true,
        winner: winnerResult,
      });
    }

    const existingWinner = finishedRooms.get(code)!;
    return NextResponse.json({
      success: true,
      isWinner: existingWinner.winnerId === playerId,
      winner: existingWinner,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
