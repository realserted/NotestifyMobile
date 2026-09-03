import { useState } from 'react';
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
  NativeSignInUnavailableError,
  OAuthCancelledError,
  signInWithGoogle,
  signInWithPassword,
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
 * Sign in. Screen 12 of the spec.
 *
 * Both paths are live and neither loads a WebView. Google is native and needs a
 * development build; email and password works anywhere, including Expo Go, but
 * requires the project's CAPTCHA protection to be off — there is no way to
 * obtain a Turnstile token on a phone without embedding the website.
 *
 * Omitted from the mockup deliberately: "Forgot password?" and "Register",
 * since neither route exists here.
 */
export default function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);

  async function handleGoogle() {
    setBusy('google');
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
      setBusy(null);
    }
  }

  async function handleEmail() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter both your email and password.');
      return;
    }

    setBusy('email');
    try {
      await signInWithPassword(email, password);
    } catch (error) {
      Alert.alert(
        'Could not sign in',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setBusy(null);
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
      <Pop offset={focused === name ? pop.sm : 0} radius={radius.md}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(name)}
          onBlur={() => setFocused((f) => (f === name ? null : f))}
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

        <View style={{ marginTop: 44 }}>
          <Text style={[type.screenTitle, { fontSize: 36, lineHeight: 39, color: t.heading }]}>
            Welcome back
          </Text>
          <Text style={[type.bodyLarge, { fontSize: 15.5, color: t.body, marginTop: 8 }]}>
            Pick up where you left off.
          </Text>
        </View>

        <View style={{ gap: layout.gap, marginTop: 28 }}>
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

        {/* The primary action sits in the bottom third, where the thumb rests. */}
        <View style={{ marginTop: 'auto', paddingTop: 32, gap: layout.gap }}>
          <Pressable onPress={handleEmail} disabled={busy !== null}>
            {({ pressed }) => (
              <Pop
                offset={pop.md}
                radius={radius.pill}
                fill={t.primary}
                pressed={pressed && busy === null}
              >
                <View style={{ minHeight: 54, alignItems: 'center', justifyContent: 'center' }}>
                  {busy === 'email' ? (
                    <ActivityIndicator color={t.onPrimary} />
                  ) : (
                    <Text style={[type.button, { color: t.onPrimary }]}>Sign in</Text>
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
              <Pop offset={0} radius={radius.pill} pressed={pressed && busy === null}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
