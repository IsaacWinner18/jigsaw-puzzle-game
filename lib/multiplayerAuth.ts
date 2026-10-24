import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

type RoomRole = 'host' | 'player';

interface RoomCapability {
  code: string;
  playerId: string;
  role: RoomRole;
}

const secret =
  process.env.MULTIPLAYER_TOKEN_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  (process.env.NODE_ENV === 'production' ? '' : 'jigsaw-local-development-secret');

export const isMultiplayerAuthConfigured = Boolean(secret);

function encode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function signature(payload: string) {
  if (!secret) return null;
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function cookieName(code: string) {
  return `jigsaw_room_${code.toUpperCase()}`;
}

export function setRoomCapability(
  response: NextResponse,
  capability: RoomCapability
) {
  const payload = encode(JSON.stringify(capability));
  const signed = signature(payload);
  if (!signed) return false;

  response.cookies.set(cookieName(capability.code), `${payload}.${signed}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 6,
  });
  return true;
}

function expireCookie(response: NextResponse, name: string) {
  response.cookies.set(name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function clearRoomCapability(response: NextResponse, code: string) {
  expireCookie(response, cookieName(code));
}

export function clearOtherRoomCapabilities(
  request: NextRequest,
  response: NextResponse,
  exceptCode?: string
) {
  const keep = exceptCode ? cookieName(exceptCode) : null;
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith('jigsaw_room_')) continue;
    if (keep && cookie.name === keep) continue;
    expireCookie(response, cookie.name);
  }
}

export function getRoomCapability(request: NextRequest, code: string): RoomCapability | null {
  const token = request.cookies.get(cookieName(code))?.value;
  if (!token) return null;

  const [payload, receivedSignature] = token.split('.');
  const expectedSignature = signature(payload || '');
  if (!payload || !receivedSignature || !expectedSignature) return null;

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const capability = JSON.parse(Buffer.from(payload, 'base64url').toString()) as RoomCapability;
    return capability.code === code.toUpperCase() ? capability : null;
  } catch {
    return null;
  }
}
