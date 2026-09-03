import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  TurnstileCaptcha,
  captchaEnabled,
  type CaptchaHandle,
} from '../../components/TurnstileCaptcha';
import { OAuthCancelledError, oauthRedirectUri, signInWithProvider } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

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
 * Sign-in screen.
 *
 * Google is the primary path and needs no captcha, so it keeps working even if
 * the web app is unreachable. The email form sits behind a disclosure: mounting
 * the Turnstile WebView is what couples this screen to notestify.com, so only
 * people who actually use a password pay that cost.
 *
 * There is no sign-up here by design — new accounts come from Google, or from
 * registering on the web.
 */
export default function LoginScreen() {
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);

  const awaitingCaptcha = mode === 'email' && captchaEnabled && !captchaToken;

  async function handleGoogle() {
    setBusy('google');
    try {
      await signInWithProvider('google');
      // On success the root layout's auth listener handles the redirect.
    } catch (error) {
      // Backing out of the browser is deliberate, not a failure.
      if (!(error instanceof OAuthCancelledError)) {
        Alert.alert(
          'Could not sign in',
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleEmail() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter both your email and password.');
      return;
    }

    setBusy('email');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setBusy(null);

    if (error) {
      // The token is spent whether or not the credentials were right, so always
      // pull a fresh challenge before the next attempt.
      captchaRef.current?.reset();
      Alert.alert('Could not sign in', error.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Notestify</Text>
        <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>

        <Pressable
          style={({ pressed }) => [
            styles.googleButton,
            (pressed || busy !== null) && styles.pressed,
          ]}
          onPress={handleGoogle}
          disabled={busy !== null}
        >
          {busy === 'google' ? (
            <ActivityIndicator color="#374151" />
          ) : (
            <>
              <GoogleMark />
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        {mode === 'choose' ? (
          <Pressable onPress={() => setMode('email')} disabled={busy !== null}>
            <Text style={styles.switchLink}>Sign in with email instead</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.divider}>
              <View style={styles.rule} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.rule} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={busy === null}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              secureTextEntry
              editable={busy === null}
              onSubmitEditing={handleEmail}
            />

            <TurnstileCaptcha ref={captchaRef} onToken={setCaptchaToken} />

            <Pressable
              style={({ pressed }) => [
                styles.emailButton,
                (pressed || busy !== null || awaitingCaptcha) && styles.pressed,
              ]}
              onPress={handleEmail}
              disabled={busy !== null || awaitingCaptcha}
            >
              {busy === 'email' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.emailButtonText}>
                  {awaitingCaptcha ? 'Verifying…' : 'Sign In'}
                </Text>
              )}
            </Pressable>
          </>
        )}

        {/* Dev only. This exact string must be allowed in the Supabase
            dashboard, otherwise Supabase falls back to the Site URL and the
            browser lands on the web app instead of returning here. */}
        {__DEV__ ? <Text style={styles.debug}>{oauthRedirectUri}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  googleButton: {
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
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  emailButton: {
    minHeight: 50,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  debug: {
    fontSize: 11,
    color: '#c4c9d2',
    textAlign: 'center',
    marginTop: 24,
  },
});
