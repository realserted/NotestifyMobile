import { Tabs } from 'expo-router';

import { TabBar } from '../../components/TabBar';

/**
 * Navigator for authenticated screens.
 *
 * Was a Stack with a white header; now a Tabs navigator with the cold-brew
 * bar. Headers are off everywhere — each screen draws its own 32px Bricolage
 * title that scrolls with the content rather than sitting in fixed chrome.
 *
 * Screens that must NOT show the tab bar — review, quiz, notes editor — belong
 * outside this group. Add them as siblings of (app) so they push over the bar.
 */
export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="decks" options={{ title: 'Decks' }} />
      <Tabs.Screen name="capture" options={{ title: 'Capture' }} />
      <Tabs.Screen name="tutor" options={{ title: 'Tutor' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}
