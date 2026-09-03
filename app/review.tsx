import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { Pop } from '../components/Pop';
import { useTheme } from '../theme/ThemeProvider';
import { layout, radius, type } from '../theme/tokens';

/**
 * Placeholder for screen 3 (Review), built last because of the swipe gesture.
 *
 * It lives outside the (app) group on purpose: review must not show the tab
 * bar. Today's "Start reviewing" CTA links here, so the route has to resolve
 * or that button dead-ends.
 */
export default function ReviewScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: layout.screenPad,
      }}
    >
      <Pressable onPress={() => router.back()} accessibilityLabel="Close review">
        {({ pressed }) => (
          <Pop offset={0} radius={radius.pill} style={{ alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 }}>
            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <X size={19} color={t.heading} strokeWidth={2.4} />
            </View>
          </Pop>
        )}
      </Pressable>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[type.sectionTitle, { color: t.heading }]}>Review</Text>
        <Text style={[type.body, { color: t.muted, marginTop: 8, textAlign: 'center' }]}>
          The swipe-to-grade card is the last screen in the build order.
        </Text>
      </View>
    </View>
  );
}
