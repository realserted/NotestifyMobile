import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { OAuthCancelledError, signInWithProvider } from '../../lib/auth';

const GoogleMark = () => (
  <Svg viewBox="0 0 18 18" width={18} height={18}>
    <Path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
    />
    <Path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
    />
    <Path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33Z" />
    <Path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
    />
  </Svg>
);

/**
 * Single auth screen.
 *
 * With OAuth there is no separate sign-up step — the first Google sign-in
 * creates the account, and every one after that signs in to it.
 */
export default function LoginScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogle() {
    setIsSubmitting(true);
    try {
      await signInWithProvider('google');
      // On success the root layout's auth listener handles the redirect.
    } catch (error) {
      // Backing out of the browser is a deliberate action, not a failure.
      if (!(error instanceof OAuthCancelledError)) {
        Alert.alert(
          'Could not sign in',
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Notestify</Text>
        <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (pressed || isSubmitting) && styles.buttonPressed,
          ]}
          onPress={handleGoogle}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#374151" />
          ) : (
            <>
              <GoogleMark />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.legal}>
          Use the same Google account you use on notestify.com.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  legal: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});
