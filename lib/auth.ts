import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { supabase } from './supabase';

/**
 * Native Google sign-in.
 *
 * This replaces the browser-based OAuth handshake. The old flow opened
 * Supabase's /authorize endpoint in the system browser and relied on a deep
 * link coming back, which meant an allowlisted redirect URL per machine and a
 * silent fall back to the web app's Site URL whenever that URL did not match.
 *
 * Here the Google SDK shows the OS account sheet, returns an ID token, and that
 * token is exchanged with Supabase directly. No browser, no redirect URL, and
 * no captcha — Google performs the bot resistance that Supabase's CAPTCHA
 * protection would otherwise demand.
 *
 * Requires a development build. The native module does not exist in Expo Go.
 */

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let configured = false;

function configure() {
  if (configured) return;

  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Supabase validates the ID ' +
        'token against this client, so sign-in cannot work without it.',
    );
  }

  GoogleSignin.configure({
    // The audience Supabase expects on the ID token. This is the same web
    // client the notestify.com app already uses.
    webClientId,
    // Lets iOS issue the token for this app rather than the web client.
    iosClientId,
  });

  configured = true;
}

export class OAuthCancelledError extends Error {
  constructor() {
    super('Sign in was cancelled.');
    this.name = 'OAuthCancelledError';
  }
}

/** Signals a build that lacks the native module — i.e. Expo Go. */
export class NativeSignInUnavailableError extends Error {
  constructor() {
    super(
      'Google sign-in needs a development build of Notestify. It cannot run ' +
        'inside Expo Go, which has no native Google module.',
    );
    this.name = 'NativeSignInUnavailableError';
  }
}

/**
 * Runs the native sign-in and leaves a Supabase session in place on success.
 *
 * Throws OAuthCancelledError when the user dismisses the sheet, so callers can
 * stay quiet rather than showing an error for a deliberate action.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    configure();
  } catch (error) {
    // A missing native module surfaces here as a TypeError on GoogleSignin.
    if (error instanceof TypeError) throw new NativeSignInUnavailableError();
    throw error;
  }

  // Android needs Play Services; on iOS this resolves immediately.
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let idToken: string | null = null;

  try {
    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') throw new OAuthCancelledError();
    idToken = response.data?.idToken ?? null;
  } catch (error) {
    if (error instanceof OAuthCancelledError) throw error;

    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new OAuthCancelledError();
    }

    throw error;
  }

  if (!idToken) {
    throw new Error('Google did not return an ID token. Please try again.');
  }

  // Supabase verifies the token's signature and audience, then mints its own
  // session. The account is linked by verified email, so this lands in the same
  // user record as the web app.
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;
}

/** Clears the Google session too, so the next sign-in shows the picker. */
export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Never block a Supabase sign-out on the Google SDK.
  }
}
