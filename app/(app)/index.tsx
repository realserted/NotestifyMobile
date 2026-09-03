import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../lib/supabase';

/**
 * Dashboard placeholder. Confirms the session is live end-to-end by showing the
 * signed-in email; real content lands here in the next pass.
 */
export default function DashboardScreen() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Could not sign out', error.message);
    }
    // The root layout's onAuthStateChange handles the redirect back to /login.
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.body}>
        {email ? `Signed in as ${email}` : 'Loading your account\u2026'}
      </Text>
      <Text style={styles.note}>
        Notes, decks, and reviews will show up here.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleSignOut}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    fontSize: 15,
    color: '#374151',
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  button: {
    marginTop: 24,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
