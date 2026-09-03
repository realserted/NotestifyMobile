import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { layout, type } from '../../theme/tokens';

/** Stub so the Tabs navigator has a route to mount. Built in a later pass. */
export default function DecksScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        paddingTop: insets.top + 12,
        paddingHorizontal: layout.screenPad,
      }}
    >
      <Text style={[type.screenTitle, { color: t.ink }]}>Decks</Text>
      <Text style={[type.body, { color: t.muted, marginTop: 8 }]}>Screen 2 of the spec. Not built yet.</Text>
    </View>
  );
}
