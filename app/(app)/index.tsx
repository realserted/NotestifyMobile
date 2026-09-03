import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Flame } from 'lucide-react-native';

import { Pop, PopCard, PopChip, PopSegments } from '../../components/Pop';
import { useTheme } from '../../theme/ThemeProvider';
import { layout, pop, radius, type } from '../../theme/tokens';

/**
 * Today. The reference screen — it establishes the shell, the spacing rhythm
 * and the token usage that every other screen inherits.
 *
 * PLACEHOLDER DATA. Every figure below is hardcoded and wired to nothing;
 * replace it with the dashboard service. Do NOT invent fields that do not
 * exist yet — the daily goal in particular needs a per-day reviewed count that
 * no query currently returns.
 */
const PLACEHOLDER = {
  firstName: 'June',
  dueToday: 34,
  streak: 12,
  reviewedToday: 18,
  dailyGoal: 30,
  dateLabel: 'Thursday, 3 September',
  week: [62, 88, 40, 74, 96, 30, 55],
};

export default function TodayScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const { firstName, dueToday, streak, reviewedToday, dailyGoal, dateLabel, week } = PLACEHOLDER;

  const decks = [
    { id: '1', title: 'Cell Biology', due: 18, cards: 96, color: t.accent },
    { id: '2', title: 'Sentiment Analysis', due: 11, cards: 64, color: '#B0703A' },
    { id: '3', title: 'Research Methods', due: 5, cards: 40, color: t.accentSoft },
  ];

  const best = Math.max(...week);
  const goalFilled = Math.round((reviewedToday / dailyGoal) * 15);
  const remaining = Math.max(0, dailyGoal - reviewedToday);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: layout.screenPad,
          paddingBottom: 24,
          gap: layout.gap,
        }}
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
          <PopChip
            label={`${streak} days`}
            fill={t.accent}
            icon={<Flame size={13} color={t.ink} strokeWidth={2.4} />}
          />
        </View>

        {/* heroFill, not primary: primary inverts to citrus in dark, which would
            put a citrus CTA on a citrus card. The hero stays espresso in both
            themes, so its on-colours are theme-independent too. */}
        <PopCard fill={t.heroFill} offset={pop.lg} radius={radius.xl}>
          <View style={{ padding: 22 }}>
            <Text style={[type.micro, { color: t.onHeroMuted }]}>Due today</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 6 }}>
              <Text style={[type.numeralXL, { color: t.onHero }]}>{dueToday}</Text>
              <Text style={[type.body, { color: t.onHeroMuted, paddingBottom: 8 }]}>
                {/* Roughly 3 cards a minute. */}
                cards · about {Math.ceil(dueToday / 3)} min
              </Text>
            </View>

            {/* asChild needs a child that accepts onPress — a plain View would
                swallow it and leave the CTA dead. */}
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
          </View>
        </PopCard>

        <PopCard>
          <View style={{ padding: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <Text style={[type.sectionTitle, { color: t.heading }]}>Today&apos;s goal</Text>
              <Text style={[type.buttonSmall, { color: t.body }]}>
                {reviewedToday} / {dailyGoal}
              </Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <PopSegments
                count={15}
                filled={goalFilled}
                fillColor={t.primary}
                emptyColor={t.track}
              />
            </View>
            <Text style={[type.meta, { color: t.muted, marginTop: 10 }]}>
              {remaining} to go — finish and your streak hits {streak + 1}.
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
                      backgroundColor: d.color,
                    }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[type.rowTitle, { color: t.heading }]}>{d.title}</Text>
                    <Text style={[type.meta, { color: t.muted, marginTop: 2 }]}>
                      {d.due} due · {d.cards} cards
                    </Text>
                  </View>
                  <Pop
                    offset={d.due > 0 ? pop.xs : 0}
                    radius={radius.pill}
                    fill={d.due > 0 ? t.primary : t.surface}
                  >
                    <View style={{ paddingHorizontal: 15, paddingVertical: 9 }}>
                      <Text style={[type.buttonSmall, { color: d.due > 0 ? t.onPrimary : t.ink }]}>
                        Study
                      </Text>
                    </View>
                  </Pop>
                </View>
              </Pop>
            ))}
          </View>
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
              {week.map((v, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: '100%',
                      height: Math.round(v * 0.52),
                      borderRadius: 7,
                      borderWidth: layout.borderWidth,
                      borderColor: t.ink,
                      backgroundColor: v === best ? t.accent : t.primary,
                    }}
                  />
                  <Text style={[type.tabLabel, { color: t.muted }]}>{'MTWTFSS'[i]}</Text>
                </View>
              ))}
            </View>
          </View>
        </PopCard>
      </ScrollView>
    </View>
  );
}
