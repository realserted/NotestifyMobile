// Polyfills `URL` / `URLSearchParams`, which the Supabase client relies on but
// React Native's Hermes runtime does not fully implement. Must be imported
// before `@supabase/supabase-js`.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// `EXPO_PUBLIC_`-prefixed vars are inlined into the bundle at build time, so
// only ever put the anon key here — never the service role key. The anon key is
// safe to ship because row level security is what actually guards the data.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the ' +
      'dev server with `npx expo start --clear`.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session across app launches. On web there is no AsyncStorage
    // during SSR, so fall back to the default (localStorage) there.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Only relevant for browser OAuth redirects; on native there is no URL to
    // read the session back out of — the deep link handler in lib/auth.ts
    // exchanges the code by hand instead.
    detectSessionInUrl: false,
    // PKCE keeps the token exchange off the redirect URL. That matters more on
    // mobile than on web: a deep link can be observed by other apps, so the
    // code alone must not be enough to mint a session without the verifier
    // held in this client's storage.
    flowType: 'pkce',
  },
});

// Supabase refreshes the access token on a timer. That timer should not run
// while the app is backgrounded, so tie it to foreground state.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
