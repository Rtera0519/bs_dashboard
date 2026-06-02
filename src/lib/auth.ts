import { cookies } from 'next/headers';

const ADMIN_ID = process.env.ADMIN_ID || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_COOKIE_NAME = 'bluequeue_session';
const SESSION_SECRET = process.env.APP_ENCRYPTION_KEY || 'bluequeue_default_session_secret_98765';

export function authenticateAdmin(adminIdInput: string, passwordInput: string): boolean {
  return adminIdInput === ADMIN_ID && passwordInput === ADMIN_PASSWORD;
}

export async function setSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, SESSION_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value === SESSION_SECRET;
}
