import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { LevelProgress } from '@/types/puzzle';
import { mergeCampaignProgress } from '@/lib/storage';
import { authenticateStudentToken } from '@/lib/studentAuth';

function resolveStudentId(request: NextRequest, bodyStudentId?: string | null): string {
  // 1. Try Authorization header
  const authHeader = request.headers.get('authorization') || request.headers.get('x-passizy-token');
  if (authHeader) {
    const verified = authenticateStudentToken(authHeader);
    if (verified?.studentId) return verified.studentId;
  }

  // 2. Try query parameter token
  const tokenParam = request.nextUrl.searchParams.get('token');
  if (tokenParam) {
    const verified = authenticateStudentToken(tokenParam);
    if (verified?.studentId) return verified.studentId;
  }

  // 3. Fallback to explicit studentId from query or body
  const queryStudentId = request.nextUrl.searchParams.get('studentId')?.trim();
  if (queryStudentId) return queryStudentId;
  if (bodyStudentId && typeof bodyStudentId === 'string' && bodyStudentId.trim()) {
    return bodyStudentId.trim();
  }

  return 'guest';
}

export async function GET(request: NextRequest) {
  try {
    const studentId = resolveStudentId(request);

    if (!isSupabaseConfigured || !supabaseAdmin) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Database storage is not configured. Missing Supabase credentials.' },
          { status: 503 }
        );
      }
      return NextResponse.json({ success: true, studentId, progress: {}, source: 'unconfigured_dev' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_campaign_progress')
      .select('progress, total_stars, highest_level')
      .eq('user_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('[Supabase Progress Query Error]', error);
      return NextResponse.json(
        {
          success: false,
          error: `Database query failed: ${error.message}. Ensure public.user_campaign_progress table exists in Supabase.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      studentId,
      progress: data?.progress || {},
      totalStars: data?.total_stars || 0,
      highestLevel: data?.highest_level || 1,
      source: 'supabase',
    });
  } catch (err: any) {
    console.error('[Campaign Progress GET Error]', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to read progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentId = resolveStudentId(request, body.studentId);
    const incomingProgress = (body.progress || {}) as Record<number, LevelProgress>;

    if (!incomingProgress || typeof incomingProgress !== 'object' || Array.isArray(incomingProgress)) {
      return NextResponse.json({ success: false, error: 'Invalid progress data payload' }, { status: 400 });
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Database storage is not configured. Missing Supabase credentials.' },
          { status: 503 }
        );
      }
      return NextResponse.json({ success: true, studentId, progress: incomingProgress, source: 'unconfigured_dev' });
    }

    // 1. Fetch current progress from Supabase to guarantee safe server-side merge
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('user_campaign_progress')
      .select('progress')
      .eq('user_id', studentId)
      .maybeSingle();

    if (fetchError) {
      console.error('[Supabase Progress Fetch Error]', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: `Database fetch failed: ${fetchError.message}. Ensure public.user_campaign_progress table exists in Supabase.`,
        },
        { status: 500 }
      );
    }

    const currentServerProgress = (existingData?.progress || {}) as Record<number, LevelProgress>;
    const merged = mergeCampaignProgress(currentServerProgress, incomingProgress);
    const totalStars = Object.values(merged).reduce((acc, l) => acc + (l.stars || 0), 0);
    const highestLevel = Math.max(1, ...Object.keys(merged).map(Number));

    // 2. Authoritative database upsert
    const { error: upsertError } = await supabaseAdmin.from('user_campaign_progress').upsert({
      user_id: studentId,
      progress: merged,
      total_stars: totalStars,
      highest_level: highestLevel,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      console.error('[Supabase Progress Upsert Error]', upsertError);
      return NextResponse.json(
        {
          success: false,
          error: `Database write failed: ${upsertError.message}. Ensure public.user_campaign_progress table exists in Supabase.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      studentId,
      progress: merged,
      totalStars,
      highestLevel,
      source: 'supabase',
    });
  } catch (err: any) {
    console.error('[Campaign Progress POST Error]', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to persist progress' }, { status: 500 });
  }
}
