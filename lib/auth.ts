import Constants, { ExecutionEnvironment } from 'expo-constants';

import { supabase } from './supabase';

/**
 * Authentication.
 *
 * Two paths:
 *
 * - Google, native. The Google SDK shows the OS account sheet and returns an
 *   ID token that goes straight to supabase.auth.signInWithIdToken. No browser,
 *   no redirect URL, no captcha. Needs a development build.
 * - Email and password, straight to Supabase. Needs CAPTCHA protection to be
 *   OFF for the project, since there is no way to obtain a Turnstile token on a
 *   phone without embedding a WebView.
 */

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/**
 * Expo Go has no native Google module.
 *
 * This is checked up front rather than by catching a failed require. Metro
 * caches a module that threw while initialising, so a second require hands back
 * a half-built object instead of throwing again — which surfaced as "Cannot
 * read property 'GoogleSignin' of undefined" rather than anything meaningful.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export class OAuthCancelledError extends Error {
  constructor() {
    super('Sign in was cancelled.');
    this.name = 'OAuthCancelledError';
  }
}

/** Signals a runtime without the native module — i.e. Expo Go. */
export class NativeSignInUnavailableError extends Error {
  constructor() {
    super(
      'Google sign-in needs a development build of Notestify. Use email and ' +
        'password in Expo Go, or run a dev build to test the native flow.',
    );
    this.name = 'NativeSignInUnavailableError';
  }
}

/** Raised when the project still has CAPTCHA protection switched on. */
export class CaptchaRequiredError extends Error {
  constructor() {
    super(
      'This Supabase project still requires a captcha for password sign-in. ' +
        'Turn CAPTCHA protection off under Authentication → Settings, or use ' +
        'Google instead.',
    );
    this.name = 'CaptchaRequiredError';
  }
}

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let cached: GoogleSigninModule | null = null;
let configured = false;

function loadGoogleSignin(): GoogleSigninModule {
  if (isExpoGo) throw new NativeSignInUnavailableError();
  if (cached) return cached;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-google-signin/google-signin') as
    | GoogleSigninModule
    | undefined;

  // A dev build missing the native side yields a module whose exports never
  // finished initialising, so check rather than trusting the require.
  if (!mod?.GoogleSignin) throw new NativeSignInUnavailableError();

  cached = mod;
  return mod;
}

function configure(mod: GoogleSigninModule) {
  if (configured) return;

  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Supabase validates the ID ' +
        "token's audience against this client, so sign-in cannot work without it.",
    );
  }

  mod.GoogleSignin.configure({
    // The audience Supabase expects — the same web client notestify.com uses.
    webClientId,
    // Lets iOS issue the token for this app rather than for the web client.
    iosClientId,
  });

  configured = true;
}

/** True when the native Google module is actually usable in this runtime. */
export const googleSignInAvailable = !isExpoGo;

/**
 * Runs the native sign-in and leaves a Supabase session in place on success.
 *
 * Throws OAuthCancelledError when the user dismisses the sheet, so callers can
 * stay quiet rather than showing an error for a deliberate action.
 */
export async function signInWithGoogle(): Promise<void> {
  const mod = loadGoogleSignin();
  configure(mod);

  // Android needs Play Services; on iOS this resolves immediately.
  await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let idToken: string | null = null;

  try {
    const response = await mod.GoogleSignin.signIn();

    if (response.type === 'cancelled') throw new OAuthCancelledError();
    idToken = response.data?.idToken ?? null;
  } catch (error) {
    if (error instanceof OAuthCancelledError) throw error;

    if (mod.isErrorWithCode(error) && error.code === mod.statusCodes.SIGN_IN_CANCELLED) {
      throw new OAuthCancelledError();
    }

    throw error;
  }

  if (!idToken) {
    throw new Error('Google did not return an ID token. Please try again.');
  }

  // Supabase verifies the token's signature and audience, then mints its own
  // session. Identities are linked by verified email, so this lands in the same
  // user record as the web app.
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;
}

/** Email and password sign-in. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (!error) return;

  // Supabase reports the captcha gate as a generic error; give it a name so the
  // UI can explain the fix instead of showing raw API wording.
  if (/captcha/i.test(error.message)) throw new CaptchaRequiredError();

  throw error;
}

/** Clears the Google session too, so the next sign-in shows the picker. */
export async function signOutGoogle(): Promise<void> {
  if (isExpoGo) return;

  try {
    const mod = loadGoogleSignin();
    await mod.GoogleSignin.signOut();
  } catch {
    // Never block a Supabase sign-out on the Google SDK.
  }
}
