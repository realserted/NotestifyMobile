import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pop } from '../../components/Pop';
import { signOutGoogle } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeProvider';
import { layout, radius, type } from '../../theme/tokens';

/**
 * Stub for screen 10 (You / Settings).
 *
 * Only the Account group's sign out is wired, because without it there is no
 * way to leave a session and re-test sign-in. The profile card and the Study
 * and Appearance groups come with the real screen.
 */
export default function YouScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleSignOut() {
    // Clear Google too, or the next sign-in silently reuses this account
    // instead of showing the picker.
    await signOutGoogle();
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
    // The root layout's auth listener handles the redirect to /login.
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        paddingTop: insets.top + 12,
        paddingHorizontal: layout.screenPad,
      }}
    >
      <Text style={[type.screenTitle, { color: t.heading }]}>You</Text>

      <Text style={[type.body, { color: t.muted, marginTop: 8 }]}>
        {email ? `Signed in as ${email}` : 'Loading your account…'}
      </Text>

      <View style={{ marginTop: 24 }}>
        <Text style={[type.micro, { color: t.muted, marginBottom: 8, marginLeft: 4 }]}>
          Account
        </Text>
        <Pressable onPress={handleSignOut}>
          {({ pressed }) => (
            <Pop radius={radius.lg} pressed={pressed}>
              <View
                style={{
                  minHeight: 52,
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <Text style={[type.rowTitle, { fontSize: 15.5, color: t.danger }]}>Sign out</Text>
              </View>
            </Pop>
          )}
        </Pressable>
      </View>
    </View>
  );
}
