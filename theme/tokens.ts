/**
 * Cold-brew design tokens.
 *
 * Single source of truth for colour, type, radii and shadow geometry.
 * Import from here — never hardcode a hex or a radius in a screen.
 */

export const light = {
  bg: '#F7E9D6',        // screen background
  surface: '#FFFBF4',   // cards, inputs, rows
  track: '#EFE0CB',     // progress tracks, inactive fills
  divider: '#E3CFB2',
  ink: '#2E1A0E',       // every border, all headings, shadow colour
  primary: '#3A2112',   // filled buttons, active tab
  onPrimary: '#FFF6E9',
  accent: '#F2A61E',    // streak, progress fill, hero CTA
  accentSoft: '#F6C453',
  accentText: '#D98E12', // accent used as text (passes contrast on paper)
  danger: '#C4452A',
  success: '#5C7A3A',
  successSoft: '#8FA05B',
  muted: '#8A6E55',
  body: '#5A4331',
  onDark: '#E4C9A8',    // muted text on an espresso surface
} as const;

export const dark = {
  bg: '#1A0F08',
  surface: '#241609',
  track: '#2E1D0E',
  divider: '#4A3421',
  ink: '#0E0805',
  primary: '#F2A61E',   // inverted: espresso cannot carry a button on near-black
  onPrimary: '#1A0F08',
  accent: '#F2A61E',
  accentSoft: '#F6C453',
  accentText: '#F2A61E',
  danger: '#E0705A',
  success: '#8FA05B',
  successSoft: '#8FA05B',
  muted: '#A98D71',
  body: '#D8C4AC',
  onDark: '#A98D71',
} as const;

export type Theme = typeof light;

/** Font families, as registered by useAppFonts(). */
export const font = {
  display: 'BricolageGrotesque_700Bold',
  displayBold: 'BricolageGrotesque_800ExtraBold',
  displayMedium: 'BricolageGrotesque_600SemiBold',
  body: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/**
 * Type scale. React Native has no em units, so letterSpacing is absolute —
 * these values are the design's em tracking multiplied by the font size.
 */
export const type = {
  screenTitle:  { fontFamily: font.displayBold,   fontSize: 32, letterSpacing: -1.1, lineHeight: 34 },
  hero:         { fontFamily: font.displayBold,   fontSize: 42, letterSpacing: -1.7, lineHeight: 45 },
  numeralXL:    { fontFamily: font.displayBold,   fontSize: 64, letterSpacing: -2.6, lineHeight: 58 },
  numeralScore: { fontFamily: font.displayBold,   fontSize: 86, letterSpacing: -4.3, lineHeight: 80 },
  numeral:      { fontFamily: font.displayBold,   fontSize: 44, letterSpacing: -1.3, lineHeight: 44 },
  cardQuestion: { fontFamily: font.displayMedium, fontSize: 26, letterSpacing: -0.65, lineHeight: 34 },
  sectionTitle: { fontFamily: font.display,       fontSize: 16.5, letterSpacing: -0.33, lineHeight: 21 },
  deckTitle:    { fontFamily: font.display,       fontSize: 17.5, letterSpacing: -0.35, lineHeight: 22 },
  body:         { fontFamily: font.body,          fontSize: 15, lineHeight: 24 },
  bodyLarge:    { fontFamily: font.body,          fontSize: 16, lineHeight: 26 },
  rowTitle:     { fontFamily: font.bold,          fontSize: 15, lineHeight: 20 },
  meta:         { fontFamily: font.semibold,      fontSize: 12.5, lineHeight: 17 },
  button:       { fontFamily: font.extrabold,     fontSize: 16, lineHeight: 20 },
  buttonSmall:  { fontFamily: font.bold,          fontSize: 13, lineHeight: 17 },
  micro:        { fontFamily: font.bold,          fontSize: 11, lineHeight: 14, letterSpacing: 1.1, textTransform: 'uppercase' as const },
  tabLabel:     { fontFamily: font.bold,          fontSize: 10.5, lineHeight: 13 },
} as const;

export const radius = {
  sm: 12,   // toolbar buttons
  md: 16,   // inputs, list rows, quiz options
  lg: 18,   // cards, stat tiles
  xl: 22,   // hero cards
  card: 26, // the flashcard
  pill: 999,
} as const;

/** Hard-shadow offsets, in px. Rendered by the Pop component. */
export const pop = {
  xs: 2,  // small chips, inline buttons
  sm: 3,  // cards, list rows
  md: 4,  // primary buttons
  lg: 5,  // hero cards
  xl: 6,  // flashcard, onboarding card
} as const;

export const layout = {
  screenPad: 20,
  screenPadWide: 24, // login, onboarding
  gap: 16,
  borderWidth: 2,
  minTap: 44,
} as const;
