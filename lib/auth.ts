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
 * Requires a development build; the native module does not exist in Expo Go.
 */

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

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
      'Google sign-in needs a development build of Notestify. It cannot run in ' +
        'Expo Go, which has no native Google module.',
    );
    this.name = 'NativeSignInUnavailableError';
  }
}

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let cached: GoogleSigninModule | null = null;
let configured = false;

/**
 * Loads the SDK on first use.
 *
 * This is deliberately a lazy require rather than a top-level import. The
 * package resolves its native spec through TurboModuleRegistry.getEnforcing at
 * module scope, which throws in Expo Go — and an import would run that during
 * route loading, crashing the entire app at startup instead of failing only
 * when someone taps sign in.
 */
function loadGoogleSignin(): GoogleSigninModule {
  if (cached) return cached;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
    throw new NativeSignInUnavailableError();
  }

  return cached;
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
    // The audience Supabase expects on the ID token — the same web client the
    // notestify.com app already uses.
    webClientId,
    // Lets iOS issue the token for this app rather than for the web client.
    iosClientId,
  });

  configured = true;
}

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

/** Clears the Google session too, so the next sign-in shows the picker. */
export async function signOutGoogle(): Promise<void> {
  try {
    const mod = loadGoogleSignin();
    await mod.GoogleSignin.signOut();
  } catch {
    // Never block a Supabase sign-out on the Google SDK — and in Expo Go the
    // module is not there at all.
  }
}
