import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  NativeSignInUnavailableError,
  OAuthCancelledError,
  signInWithGoogle,
} from '../../lib/auth';
import { Pop } from '../../components/Pop';
import { useTheme } from '../../theme/ThemeProvider';
import { layout, pop, radius, type } from '../../theme/tokens';

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
 * Sign in. Screen 12 of the spec, reduced to its one live path.
 *
 * The email and password fields the mockup shows are gone on purpose. Password
 * sign-in requires a Turnstile token, because Supabase enforces CAPTCHA
 * protection on every email-based endpoint project-wide — and the only way to
 * obtain one on a phone was a WebView pointed at notestify.com. Native Google
 * sign-in needs no captcha at all, so dropping the password path removed both
 * the WebView and the coupling to the website.
 *
 * Existing password-only accounts reach the app by signing in with Google on
 * the same address; Supabase links identities that share a verified email.
 */
export default function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogle() {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      // On success the root layout's auth listener handles the redirect.
    } catch (error) {
      // Dismissing the account sheet is deliberate, not a failure.
      if (error instanceof OAuthCancelledError) return;

      Alert.alert(
        error instanceof NativeSignInUnavailableError
          ? 'Development build required'
          : 'Could not sign in',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 28,
        paddingHorizontal: layout.screenPadWide,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 5,
            borderWidth: layout.borderWidth,
            borderColor: t.ink,
            backgroundColor: t.accent,
          }}
        />
        <Text style={[type.deckTitle, { fontSize: 22, color: t.heading }]}>Notestify</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[type.screenTitle, { fontSize: 36, lineHeight: 39, color: t.heading }]}>
          Welcome back
        </Text>
        <Text style={[type.bodyLarge, { fontSize: 15.5, color: t.body, marginTop: 8 }]}>
          Pick up where you left off.
        </Text>
      </View>

      {/* The primary action sits in the bottom third, where the thumb rests. */}
      <View style={{ gap: 14 }}>
        <Pressable onPress={handleGoogle} disabled={isSubmitting}>
          {({ pressed }) => (
            <Pop offset={pop.md} radius={radius.pill} pressed={pressed && !isSubmitting}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  minHeight: 54,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={t.heading} />
                ) : (
                  <>
                    <GoogleMark />
                    <Text style={[type.button, { fontSize: 15.5, color: t.heading }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </View>
            </Pop>
          )}
        </Pressable>

        <Text style={[type.meta, { color: t.muted, textAlign: 'center' }]}>
          Use the same Google account you use on notestify.com.
        </Text>
      </View>
    </View>
  );
}
