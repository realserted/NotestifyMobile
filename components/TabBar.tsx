import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { BookOpen, LayoutDashboard, MessageSquare, ScanLine, User } from 'lucide-react-native';

import { useTheme } from '../theme/ThemeProvider';
import { layout, radius, type } from '../theme/tokens';

/**
 * expo-router 57 vendors react-navigation, so `@react-navigation/bottom-tabs`
 * is not installable as a package here. Derive the prop type off the public
 * Tabs component instead of deep-importing expo-router's build output.
 */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS = {
  index: LayoutDashboard,
  decks: BookOpen,
  capture: ScanLine,
  tutor: MessageSquare,
  you: User,
} as const;

const LABELS = {
  index: 'Today',
  decks: 'Decks',
  capture: 'Capture',
  tutor: 'Tutor',
  you: 'You',
} as const;

/**
 * Five-tab bottom bar. The active tab is an icon in a filled pill with its own
 * hard shadow; inactive tabs are a muted glyph plus label.
 */
export function TabBar({ state, navigation }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingTop: 10,
        paddingHorizontal: 8,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: t.surface,
        borderTopWidth: layout.borderWidth,
        borderTopColor: t.divider,
      }}
    >
      {state.routes.map((route, index) => {
        const key = route.name as keyof typeof ICONS;
        const Icon = ICONS[key];
        if (!Icon) return null;

        const focused = state.index === index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={LABELS[key]}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: layout.minTap }}
          >
            <View style={{ paddingRight: focused ? 2 : 0, paddingBottom: focused ? 2 : 0 }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    left: 2,
                    top: 2,
                    right: 0,
                    bottom: 0,
                    borderRadius: radius.pill,
                    backgroundColor: t.ink,
                  }}
                />
              )}
              <View
                style={{
                  width: 46,
                  height: 31,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  borderWidth: layout.borderWidth,
                  borderColor: focused ? t.ink : 'transparent',
                  backgroundColor: focused ? t.primary : 'transparent',
                }}
              >
                <Icon size={19} color={focused ? t.onPrimary : t.muted} strokeWidth={2.1} />
              </View>
            </View>
            <Text style={[type.tabLabel, { color: focused ? t.ink : t.muted }]}>{LABELS[key]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
