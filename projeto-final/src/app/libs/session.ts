'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.TOKEN ?? 'fallback-secret-key';
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email: string;
  perfil: string;
}

export async function createSessionToken(userId: string, email: string, perfil: string) {
  const token = await new SignJWT({ userId, email, perfil })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set('sgoa_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
    path: '/',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('sgoa_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('sgoa_session');
}
