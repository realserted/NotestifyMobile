import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

/**
 * Root layout. Owns the auth session and acts as the redirect gate for every
 * route in the app:
 *
 *   - no session, outside the (auth) group  -> send to /login
 *   - session, inside the (auth) group      -> send to the dashboard
 *
 * Rendering `<Slot />` (rather than a `<Stack />`) keeps this layout purely a
 * pass-through; the nested (app) layout owns the actual navigator.
 */
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Read whatever session AsyncStorage already has (this is what makes the
    // user stay logged in between app launches).
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    // Then keep it in sync — covers sign in, sign out, and token refresh.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Wait for the session check — redirecting first would bounce a logged-in
    // user to /login for a frame on every cold start.
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Slot />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
