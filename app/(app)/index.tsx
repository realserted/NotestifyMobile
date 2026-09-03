import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { useQueries } from '@tanstack/react-query';

import { Pop, PopCard, PopChip, PopSegments } from '../../components/Pop';
import { keys } from '../../lib/queryClient';
import {
  getDueCount,
  getDueDecks,
  getFirstName,
  getReviewedToday,
  getStreak,
  getWeekReviews,
} from '../../lib/queries/dashboard';
import { useTheme } from '../../theme/ThemeProvider';
import { layout, pop, radius, type } from '../../theme/tokens';

/**
 * Today. The reference screen.
 *
 * The daily goal target is the one figure here with nothing behind it: the
 * schema has no per-user settings table, so 30 is a constant until one exists.
 * Everything else is live.
 */
const DAILY_GOAL = 30;
const GOAL_SEGMENTS = 15;

/** Stable per-deck colour, since the decks table has no colour column. */
function deckColor(id: string, palette: string[]): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

export default function TodayScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const results = useQueries({
    queries: [
      { queryKey: keys.dueCount, queryFn: getDueCount },
      { queryKey: keys.streak, queryFn: getStreak },
      { queryKey: keys.reviewedToday, queryFn: getReviewedToday },
      { queryKey: keys.weekReviews, queryFn: getWeekReviews },
      { queryKey: keys.dueDecks, queryFn: () => getDueDecks(3) },
      { queryKey: ['profile', 'firstName'], queryFn: getFirstName },
    ],
  });

  const [dueQ, streakQ, reviewedQ, weekQ, decksQ, nameQ] = results;

  const isLoading = results.some((r) => r.isPending);
  const isRefreshing = results.some((r) => r.isRefetching);
  const error = results.find((r) => r.error)?.error;
  const refetchAll = () => results.forEach((r) => void r.refetch());

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: layout.screenPad,
          gap: 14,
        }}
      >
        <Text style={[type.sectionTitle, { color: t.heading, textAlign: 'center' }]}>
          Could not load your day
        </Text>
        <Text style={[type.body, { color: t.muted, textAlign: 'center' }]}>
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Text>
        <Pressable onPress={refetchAll}>
          {({ pressed }) => (
            <Pop offset={pop.xs} radius={radius.pill} fill={t.primary} pressed={pressed}>
              <View style={{ paddingHorizontal: 20, paddingVertical: 12, minHeight: layout.minTap, justifyContent: 'center' }}>
                <Text style={[type.buttonSmall, { color: t.onPrimary }]}>Try again</Text>
              </View>
            </Pop>
          )}
        </Pressable>
      </View>
    );
  }

  const firstName = nameQ.data ?? 'there';
  const dueToday = dueQ.data ?? 0;
  const streak = streakQ.data ?? 0;
  const reviewedToday = reviewedQ.data ?? 0;
  const week = weekQ.data ?? [];
  const decks = decksQ.data ?? [];

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const best = Math.max(...week.map((d) => d.count), 0);
  const goalFilled = Math.min(
    GOAL_SEGMENTS,
    Math.round((reviewedToday / DAILY_GOAL) * GOAL_SEGMENTS),
  );
  const remaining = Math.max(0, DAILY_GOAL - reviewedToday);
  const palette = [t.accent, '#B0703A', t.accentSoft];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: layout.screenPad,
          paddingBottom: 24,
          gap: layout.gap,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetchAll} tintColor={t.accent} />
        }
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[type.screenTitle, { color: t.heading }]}>Hey, {firstName}</Text>
            <Text style={[type.body, { color: t.body, marginTop: 5 }]}>{dateLabel}</Text>
          </View>
          {streak > 0 ? (
            <PopChip
              label={`${streak} ${streak === 1 ? 'day' : 'days'}`}
              fill={t.accent}
              icon={<Flame size={13} color={t.ink} strokeWidth={2.4} />}
            />
          ) : null}
        </View>

        {/* heroFill, not primary: primary inverts to citrus in dark, which would
            put a citrus CTA on a citrus card. */}
        <PopCard fill={t.heroFill} offset={pop.lg} radius={radius.xl}>
          <View style={{ padding: 22 }}>
            <Text style={[type.micro, { color: t.onHeroMuted }]}>Due today</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 6 }}>
              <Text style={[type.numeralXL, { color: t.onHero }]}>{dueToday}</Text>
              <Text style={[type.body, { color: t.onHeroMuted, paddingBottom: 8 }]}>
                {dueToday === 0
                  ? 'nothing due — nicely done'
                  : /* Roughly 3 cards a minute. */
                    `cards · about ${Math.ceil(dueToday / 3)} min`}
              </Text>
            </View>

            {dueToday > 0 ? (
              <Link href="/review" asChild>
                <Pressable
                  accessibilityRole="button"
                  style={{
                    marginTop: 18,
                    minHeight: layout.minTap,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 14,
                    borderRadius: radius.pill,
                    borderWidth: layout.borderWidth,
                    borderColor: t.ink,
                    backgroundColor: t.accent,
                  }}
                >
                  <Text style={[type.button, { color: t.ink }]}>Start reviewing</Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        </PopCard>

        <PopCard>
          <View style={{ padding: 18 }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <Text style={[type.sectionTitle, { color: t.heading }]}>Today&apos;s goal</Text>
              <Text style={[type.buttonSmall, { color: t.body }]}>
                {reviewedToday} / {DAILY_GOAL}
              </Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <PopSegments
                count={GOAL_SEGMENTS}
                filled={goalFilled}
                fillColor={t.primary}
                emptyColor={t.track}
              />
            </View>
            <Text style={[type.meta, { color: t.muted, marginTop: 10 }]}>
              {remaining === 0
                ? "Goal met — everything past this is a bonus."
                : `${remaining} to go — finish and your streak hits ${streak + 1}.`}
            </Text>
          </View>
        </PopCard>

        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <Text style={[type.sectionTitle, { color: t.heading }]}>Jump back in</Text>
            <Link href="/decks" style={[type.buttonSmall, { color: t.accentText }]}>
              All decks
            </Link>
          </View>

          {decks.length === 0 ? (
            <PopCard>
              <View style={{ padding: 18, gap: 6 }}>
                <Text style={[type.rowTitle, { color: t.heading }]}>No decks yet</Text>
                <Text style={[type.meta, { color: t.muted }]}>
                  Add material on the Capture tab and your decks will show up here.
                </Text>
              </View>
            </PopCard>
          ) : (
            <View style={{ gap: 10 }}>
              {decks.map((d) => (
                <Pop key={d.id} radius={radius.md}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 13,
                      padding: 12,
                      minHeight: layout.minTap,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        borderWidth: layout.borderWidth,
                        borderColor: t.ink,
                        backgroundColor: deckColor(d.id, palette),
                      }}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[type.rowTitle, { color: t.heading }]} numberOfLines={1}>
                        {d.title}
                      </Text>
                      <Text style={[type.meta, { color: t.muted, marginTop: 2 }]}>
                        {d.dueCount} due · {d.cardCount} cards
                      </Text>
                    </View>
                    <Pop
                      offset={d.dueCount > 0 ? pop.xs : 0}
                      radius={radius.pill}
                      fill={d.dueCount > 0 ? t.primary : t.surface}
                    >
                      <View style={{ paddingHorizontal: 15, paddingVertical: 9 }}>
                        <Text
                          style={[
                            type.buttonSmall,
                            { color: d.dueCount > 0 ? t.onPrimary : t.ink },
                          ]}
                        >
                          Study
                        </Text>
                      </View>
                    </Pop>
                  </View>
                </Pop>
              ))}
            </View>
          )}
        </View>

        <PopCard>
          <View style={{ padding: 18 }}>
            <Text style={[type.sectionTitle, { color: t.heading }]}>This week</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 8,
                height: 78,
                marginTop: 14,
              }}
            >
              {week.map((d) => (
                <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: '100%',
                      // Floor of 6px so an empty day still reads as a bar
                      // rather than vanishing into the card.
                      height: best > 0 ? Math.max(6, Math.round((d.count / best) * 52)) : 6,
                      borderRadius: 7,
                      borderWidth: layout.borderWidth,
                      borderColor: t.ink,
                      backgroundColor: d.count > 0 && d.count === best ? t.accent : t.primary,
                    }}
                  />
                  <Text style={[type.tabLabel, { color: t.muted }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </PopCard>
      </ScrollView>
    </View>
  );
}
