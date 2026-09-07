import {createBrowserClient, parseCookieHeader, serializeCookieHeader} from '@supabase/ssr';
import {REMEMBER_COOKIE, remembersLogin, sessionCookieOptions} from './session';

export function readRememberLogin() {
  return remembersLogin(parseCookieHeader(document.cookie).find(c => c.name === REMEMBER_COOKIE)?.value);
}

export function setRememberLogin(remember: boolean) {
  document.cookie = serializeCookieHeader(REMEMBER_COOKIE, remember ? 'remember' : 'session',
    sessionCookieOptions({}, remember, location.protocol === 'https:'));
}

export const browserAuth = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {persistSession: true, autoRefreshToken: true},
    cookies: {
      getAll: () => parseCookieHeader(document.cookie),
      setAll(values) {
        // Read on every write: the singleton must respect a changed checkbox too.
        const remember = readRememberLogin();
        values.forEach(({name, value, options}) => {
          document.cookie = serializeCookieHeader(name, value,
            sessionCookieOptions(options, remember, location.protocol === 'https:'));
        });
        setRememberLogin(remember);
      },
    },
  },
);
