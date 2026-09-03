import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic layer over app.json.
 *
 * The native Google Sign-In plugin needs `iosUrlScheme` — the reversed iOS
 * OAuth client ID — and it throws at config time if that is missing. Reading it
 * from the environment and adding the plugin only when it is present keeps
 * `expo start` working before the Google Cloud client exists; the build is the
 * only thing that actually needs it.
 */
const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Notestify',
  slug: config.slug ?? 'NotestifyMobile',

  ios: {
    ...config.ios,
    // Permanent once the app ships to the App Store — change it now if you want
    // a different one.
    bundleIdentifier: 'com.notestify.mobile',
    supportsTablet: true,
  },

  android: {
    ...config.android,
    package: 'com.notestify.mobile',
  },

  plugins: [
    ...((config.plugins ?? []) as NonNullable<ExpoConfig['plugins']>),
    ...(iosUrlScheme
      ? ([['@react-native-google-signin/google-signin', { iosUrlScheme }]] as [string, any][])
      : []),
  ],
});
