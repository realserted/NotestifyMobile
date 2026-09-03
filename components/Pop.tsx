import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { layout, pop, radius, type } from '../theme/tokens';

/**
 * The hard offset shadow.
 *
 * React Native cannot render a zero-blur shadow — shadowRadius 0 still
 * antialiases on iOS, and Android ignores it in favour of elevation. So the
 * shadow is a real View: an ink-filled rectangle offset down and right, with
 * the bordered surface sitting on top of it.
 *
 * The wrapper reserves the offset as padding, so the shadow stays inside the
 * component's own bounds and never overlaps a sibling.
 */
export function Pop({
  offset = pop.sm,
  radius: r = radius.lg,
  fill,
  pressed = false,
  style,
  children,
}: {
  offset?: number;
  radius?: number;
  fill?: string;
  pressed?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[{ paddingRight: offset, paddingBottom: offset }, style]}>
      {!pressed && (
        <View
          style={{
            position: 'absolute',
            left: offset,
            top: offset,
            right: 0,
            bottom: 0,
            borderRadius: r,
            backgroundColor: t.ink,
          }}
        />
      )}
      <View
        style={{
          borderRadius: r,
          borderWidth: layout.borderWidth,
          borderColor: t.ink,
          backgroundColor: fill ?? t.surface,
          overflow: 'hidden',
          // Always an array. Toggling this between an array and `undefined`
          // makes Fabric's prop diff hand `null` to processTransform, which
          // crashes the render with "Cannot read property 'forEach' of null".
          transform: [
            { translateX: pressed ? offset : 0 },
            { translateY: pressed ? offset : 0 },
          ],
        }}
      >
        {children}
      </View>
    </View>
  );
}

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'danger';

/**
 * Pill button. Presses into its shadow: the surface translates by the offset
 * and the shadow layer is removed, so the button appears to sit down flat.
 */
export function PopButton({
  label,
  onPress,
  variant = 'primary',
  offset = pop.md,
  full = true,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  offset?: number;
  full?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();

  const fill =
    variant === 'primary' ? t.primary
    : variant === 'accent' ? t.accent
    : variant === 'danger' ? t.danger
    : t.surface;

  const textColor =
    variant === 'primary' ? t.onPrimary
    : variant === 'danger' ? t.surface
    : t.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ width: full ? '100%' : undefined, opacity: disabled ? 0.55 : 1 }}
    >
      {({ pressed }) => (
        <Pop offset={offset} radius={radius.pill} fill={fill} pressed={pressed && !disabled}>
          <View style={{ minHeight: layout.minTap + 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
            <Text style={[type.button, { color: textColor }]}>{label}</Text>
          </View>
        </Pop>
      )}
    </Pressable>
  );
}

/** Card surface. Content padding is the caller's job. */
export function PopCard({
  children,
  fill,
  offset = pop.sm,
  radius: r = radius.lg,
  style,
}: {
  children: React.ReactNode;
  fill?: string;
  offset?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  return (
    <Pop offset={offset} radius={r} fill={fill} style={style}>
      {children}
    </Pop>
  );
}

/** Small pill: streak counts, filters, status. */
export function PopChip({
  label,
  fill,
  color,
  icon,
  offset = 0,
}: {
  label: string;
  fill?: string;
  color?: string;
  icon?: React.ReactNode;
  offset?: number;
}) {
  const t = useTheme();
  return (
    <Pop offset={offset} radius={radius.pill} fill={fill ?? t.surface}>
      <View style={styles.chip}>
        {icon}
        <Text style={[type.buttonSmall, { color: color ?? t.ink }]}>{label}</Text>
      </View>
    </Pop>
  );
}

/**
 * Segmented bar — the daily goal and the review session pips both use this.
 *
 * `fillColor` / `emptyColor` exist because the two callers disagree: review
 * pips are citrus-on-paper with an espresso "current" marker, while the daily
 * goal is espresso-on-track. Defaults match the review pips.
 */
export function PopSegments({
  count,
  filled,
  current,
  height = 14,
  segRadius = 5,
  gap = 3,
  fillColor,
  emptyColor,
}: {
  count: number;
  filled: number;
  current?: number;
  height?: number;
  segRadius?: number;
  gap?: number;
  fillColor?: string;
  emptyColor?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height,
            borderRadius: segRadius,
            borderWidth: layout.borderWidth,
            borderColor: t.ink,
            backgroundColor:
              i < filled ? (fillColor ?? t.accent)
              : i === current ? t.primary
              : (emptyColor ?? t.surface),
          }}
        />
      ))}
    </View>
  );
}

/** Continuous meter — quiz progress, deck maturity, topic accuracy. */
export function PopMeter({
  value,
  fill,
  height = 8,
}: {
  value: number;
  fill?: string;
  height?: number;
}) {
  const t = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={{
        height,
        borderRadius: radius.pill,
        borderWidth: layout.borderWidth,
        borderColor: t.ink,
        backgroundColor: t.track,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${clamped}%`, height: '100%', backgroundColor: fill ?? t.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
});
