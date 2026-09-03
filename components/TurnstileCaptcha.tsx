import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

/**
 * Cloudflare Turnstile, rendered through the web app.
 *
 * Turnstile validates a challenge against the domain serving it, which rules
 * out rendering the widget from HTML bundled in the app — the origin would not
 * match the site key's allowlist. This loads /mobile-captcha from the Notestify
 * web app, whose origin is already allowlisted, and reads the token back off
 * the WebView bridge.
 *
 * Mounted only by the email/password path. Google sign-in requires no captcha,
 * so it keeps working even when this page is unreachable.
 */

const CAPTCHA_URL = process.env.EXPO_PUBLIC_CAPTCHA_URL;

/** Whether a token must be obtained before the password form may be submitted. */
export const captchaEnabled = Boolean(CAPTCHA_URL);

export interface CaptchaHandle {
  /**
   * Requests a fresh challenge. Tokens are single-use, so this must run after a
   * failed submit or the retry fails on the captcha rather than on the real
   * credentials.
   */
  reset: () => void;
}

interface Props {
  onToken: (token: string | null) => void;
}

export const TurnstileCaptcha = forwardRef<CaptchaHandle, Props>(function TurnstileCaptcha(
  { onToken },
  ref,
) {
  const webViewRef = useRef<WebView>(null);
  const [height, setHeight] = useState(70);

  useImperativeHandle(ref, () => ({
    reset: () => {
      onToken(null);
      webViewRef.current?.postMessage('reset');
    },
  }));

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: { type?: string; token?: string; reason?: string };
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      switch (message.type) {
        case 'token':
          onToken(message.token ?? null);
          break;
        case 'expired':
          onToken(null);
          break;
        case 'error':
          // Includes the case where the web app has captcha switched off.
          // Supabase is the real gate either way.
          onToken(null);
          if (message.reason === 'captcha-disabled') setHeight(0);
          break;
        default:
          break;
      }
    },
    [onToken],
  );

  if (!CAPTCHA_URL) return null;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${CAPTCHA_URL}?theme=light` }}
        onMessage={handleMessage}
        style={styles.webView}
        // A small transparent island, not a page — strip the usual chrome.
        scrollEnabled={false}
        bounces={false}
        androidLayerType="software"
        originWhitelist={['https://*']}
        javaScriptEnabled
        domStorageEnabled
        // Turnstile needs third-party storage to keep a challenge session.
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
