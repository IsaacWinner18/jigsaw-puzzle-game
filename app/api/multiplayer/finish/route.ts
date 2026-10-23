import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface RoomResult {
  code: string;
  winnerId: string;
  winnerName: string;
  finishedAt: number;
  elapsedSeconds: number;
}

const finishedRooms = new Map<string, RoomResult>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, playerId, playerName, elapsedSeconds } = body;

    if (!roomCode || !playerId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const code = String(roomCode).toUpperCase();
    const finishedAt = Date.now();

    // Check Supabase if configured for persistent race verification
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existingWinners } = await supabase
          .from('race_results')
          .select('*')
          .eq('room_code', code)
          .eq('is_winner', true)
          .limit(1);

        const hasDbWinner = existingWinners && existingWinners.length > 0;
        const isDbWinner = !hasDbWinner;

        await supabase.from('race_results').insert({
          room_code: code,
          player_id: playerId,
          player_name: playerName || 'Player',
          elapsed_seconds: elapsedSeconds || 0,
          is_winner: isDbWinner,
        });

        if (isDbWinner) {
          await supabase
            .from('rooms')
            .update({
              status: 'finished',
              winner_id: playerId,
              winner_name: playerName || 'Player',
            })
            .eq('code', code);
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
              winnerName: playerName || 'Player',
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
      }
    }

    // In-memory fallback
    if (!finishedRooms.has(code)) {
      const winnerResult: RoomResult = {
        code,
        winnerId: playerId,
        winnerName: playerName || 'Player',
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
