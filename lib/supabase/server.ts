import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {REMEMBER_COOKIE, remembersLogin, sessionCookieOptions} from './session';
export async function authClient() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          const remember = remembersLogin(jar.get(REMEMBER_COOKIE)?.value);
          const secure = process.env.NODE_ENV === 'production';
          values.forEach(({name, value, options}) => jar.set(name, value, sessionCookieOptions(options, remember, secure)));
          jar.set(REMEMBER_COOKIE, remember ? 'remember' : 'session', sessionCookieOptions({}, remember, secure));
        } catch { /* Server Components: proxy persists refreshed cookies. */ }
      },
    },
  });
}
