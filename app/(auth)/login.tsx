import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  TurnstileCaptcha,
  captchaEnabled,
  type CaptchaHandle,
} from '../../components/TurnstileCaptcha';
import { OAuthCancelledError, oauthRedirectUri, signInWithProvider } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
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
 * Sign in. Screen 12 of the spec.
 *
 * Both paths are live: Google needs no captcha, and the password form needs a
 * Turnstile token because Supabase enforces CAPTCHA protection project-wide on
 * every email-based endpoint.
 *
 * The captcha WebView mounts lazily, on first focus of either field. Loading it
 * eagerly would tie a Google sign-in to notestify.com being reachable, which is
 * exactly the coupling the OAuth path exists to avoid.
 *
 * Omitted from the mockup deliberately: "Forgot password?" and "Register" —
 * neither route exists in this app. Registration happens on the web or by
 * signing in with Google.
 */
export default function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaMounted, setCaptchaMounted] = useState(false);
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

  const awaitingCaptcha = captchaMounted && captchaEnabled && !captchaUnavailable && !captchaToken;

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

  const field = (
    label: string,
    value: string,
    onChangeText: (next: string) => void,
    name: 'email' | 'password',
    extra: React.ComponentProps<typeof TextInput>,
  ) => (
    <View>
      <Text style={[type.micro, { color: t.muted, marginBottom: 7 }]}>{label}</Text>
      <Pop offset={focusedField === name ? pop.sm : 0} radius={radius.md}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocusedField(name);
            setCaptchaMounted(true);
          }}
          onBlur={() => setFocusedField((f) => (f === name ? null : f))}
          placeholderTextColor={t.muted}
          editable={busy === null}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 15,
            fontSize: 16,
            fontFamily: type.body.fontFamily,
            color: t.heading,
          }}
          {...extra}
        />
      </Pop>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: layout.screenPadWide,
        }}
        keyboardShouldPersistTaps="handled"
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

        <View style={{ marginTop: 48 }}>
          <Text style={[type.screenTitle, { fontSize: 36, lineHeight: 39, color: t.heading }]}>
            Welcome back
          </Text>
          <Text style={[type.bodyLarge, { fontSize: 15.5, color: t.body, marginTop: 8 }]}>
            Pick up where you left off.
          </Text>
        </View>

        <View style={{ gap: layout.gap, marginTop: 32 }}>
          {field('Email', email, setEmail, 'email', {
            placeholder: 'you@uni.edu',
            autoCapitalize: 'none',
            autoComplete: 'email',
            keyboardType: 'email-address',
            textContentType: 'emailAddress',
          })}
          {field('Password', password, setPassword, 'password', {
            placeholder: '••••••••',
            autoCapitalize: 'none',
            autoComplete: 'current-password',
            textContentType: 'password',
            secureTextEntry: true,
            onSubmitEditing: handleEmail,
          })}
        </View>

        {captchaMounted ? (
          <View style={{ marginTop: 14 }}>
            <TurnstileCaptcha
              ref={captchaRef}
              onToken={setCaptchaToken}
              onUnavailable={() => setCaptchaUnavailable(true)}
            />
          </View>
        ) : null}

        <View style={{ marginTop: 'auto', paddingTop: 32, gap: layout.gap }}>
          <Pressable
            onPress={handleEmail}
            disabled={busy !== null || awaitingCaptcha}
            style={{ opacity: busy !== null || awaitingCaptcha ? 0.55 : 1 }}
          >
            {({ pressed }) => (
              <Pop
                offset={pop.md}
                radius={radius.pill}
                fill={t.primary}
                pressed={pressed && busy === null && !awaitingCaptcha}
              >
                <View style={{ minHeight: 54, alignItems: 'center', justifyContent: 'center' }}>
                  {busy === 'email' ? (
                    <ActivityIndicator color={t.onPrimary} />
                  ) : (
                    <Text style={[type.button, { color: t.onPrimary }]}>
                      {awaitingCaptcha ? 'Verifying…' : 'Sign in'}
                    </Text>
                  )}
                </View>
              </Pop>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 2, backgroundColor: t.divider }} />
            <Text style={[type.micro, { color: t.muted }]}>or</Text>
            <View style={{ flex: 1, height: 2, backgroundColor: t.divider }} />
          </View>

          <Pressable onPress={handleGoogle} disabled={busy !== null}>
            {({ pressed }) => (
              <Pop offset={0} radius={radius.pill} style={{ opacity: pressed ? 0.6 : 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    minHeight: 54,
                  }}
                >
                  {busy === 'google' ? (
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

          {/* Dev only. This exact string must be allowed in the Supabase
              dashboard, otherwise Supabase falls back to the Site URL and the
              browser lands on the web app instead of returning here. */}
          {__DEV__ ? (
            <Text style={[type.meta, { color: t.divider, textAlign: 'center' }]}>
              {oauthRedirectUri}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
