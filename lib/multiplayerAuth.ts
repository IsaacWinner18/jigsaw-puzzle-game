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

export function createCapabilityToken(capability: RoomCapability): string | null {
  const payload = encode(JSON.stringify(capability));
  const signed = signature(payload);
  if (!signed) return null;
  return `${payload}.${signed}`;
}

export function verifyCapabilityToken(token: string | null | undefined, code: string): RoomCapability | null {
  if (!token || typeof token !== 'string') return null;

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

export function setRoomCapability(
  response: NextResponse,
  capability: RoomCapability
): string | null {
  const token = createCapabilityToken(capability);
  if (!token) return null;

  // Use SameSite=None; Secure in production to support iframe embedding (Passizy mini-app)
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set(cookieName(capability.code), token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 6,
  });
  return token;
}

function expireCookie(response: NextResponse, name: string) {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set(name, '', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
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

export function getRoomCapability(
  request: NextRequest,
  code: string,
  explicitToken?: string | null
): RoomCapability | null {
  // 1. Check explicit token from request body
  if (explicitToken) {
    const verified = verifyCapabilityToken(explicitToken, code);
    if (verified) return verified;
  }

  // 2. Check custom x-room-token header
  const headerToken = request.headers.get('x-room-token');
  if (headerToken) {
    const verified = verifyCapabilityToken(headerToken, code);
    if (verified) return verified;
  }

  // 3. Check standard Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = verifyCapabilityToken(bearerToken, code);
    if (verified) return verified;
  }

  // 4. Fallback to cookie
  const cookieToken = request.cookies.get(cookieName(code))?.value;
  if (cookieToken) {
    return verifyCapabilityToken(cookieToken, code);
  }

  return null;
}

