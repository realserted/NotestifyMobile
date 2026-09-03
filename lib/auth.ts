import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

/**
 * OAuth sign-in for native.
 *
 * The app never talks to Google directly. It opens Supabase's /authorize
 * endpoint in the system browser; Google redirects back to Supabase's own
 * https callback (already registered in the Google console for the web app),
 * and Supabase then redirects to the deep link below. That indirection is why
 * no Google Cloud configuration is needed for mobile.
 */

// Dismisses the auth browser if one was left open by a previous attempt.
WebBrowser.maybeCompleteAuthSession();

/**
 * In Expo Go this resolves to an exp:// URL that encodes the dev server's LAN
 * address, so it changes with the network. In a standalone build it is
 * notestifymobile://auth/callback. Both shapes must be allowed in the Supabase
 * dashboard under Authentication -> URL Configuration.
 */
export const oauthRedirectUri = Linking.createURL('/auth/callback');

export type OAuthProvider = 'google' | 'apple';

export class OAuthCancelledError extends Error {
  constructor() {
    super('Sign in was cancelled.');
    this.name = 'OAuthCancelledError';
  }
}

/**
 * Runs the full OAuth handshake and leaves a session in place on success.
 *
 * Throws OAuthCancelledError if the user backed out, so callers can stay quiet
 * rather than showing an error for a deliberate action.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: oauthRedirectUri,
      // Without this the client tries to navigate the page itself, which is a
      // no-op on native and leaves the promise resolved with nothing to open.
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('Supabase did not return an authorization URL.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, oauthRedirectUri);

  if (result.type !== 'success') throw new OAuthCancelledError();

  const url = new URL(result.url);

  // The provider reports refusals on the redirect rather than by failing.
  const description = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  if (description) throw new Error(description);

  const code = url.searchParams.get('code');
  if (!code) throw new Error('No authorization code was returned. Please try again.');

  // PKCE: pairs the code with the verifier this client stored when it built
  // the authorize URL, then writes the session to AsyncStorage.
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}
