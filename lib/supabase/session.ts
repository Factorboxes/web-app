import type {CookieOptions} from '@supabase/ssr';

// This preference contains no credentials. Supabase owns the session tokens.
export const REMEMBER_COOKIE = 'factorboxes-remember-login';
export const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;
export const remembersLogin = (value?: string) => value !== 'session';

/** Apply the same persistence policy to browser writes and server refreshes. */
export function sessionCookieOptions(options: CookieOptions, remember: boolean, secure: boolean): CookieOptions {
  const result = {...options, path: '/', sameSite: 'lax' as const, secure};
  // Never turn a Supabase deletion (logout or old token chunk) into a live cookie.
  if (options.maxAge !== undefined && options.maxAge <= 0) return result;
  delete result.expires;
  if (remember) result.maxAge = REMEMBER_MAX_AGE;
  else delete result.maxAge;
  return result;
}

export function loginDestination(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || /[\\\u0000-\u0020]/.test(next)) return '/store';
  const url = new URL(next, 'https://factorboxes.invalid');
  if (url.origin !== 'https://factorboxes.invalid' || url.pathname === '/' || /^\/(?:login|auth)(?:\/|$)/.test(url.pathname)) return '/store';
  return url.pathname + url.search + url.hash;
}
