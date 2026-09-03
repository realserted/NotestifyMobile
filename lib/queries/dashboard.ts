import { supabase } from '../supabase';

/**
 * Dashboard reads.
 *
 * These query Supabase directly rather than going through notestify.com's
 * /api routes: those authenticate by cookie and would 401 from a native
 * client. RLS already scopes every one of these tables to the signed-in user,
 * so `user_id` never needs to appear in a filter here — the policy applies it.
 */

/** Local calendar day as YYYY-MM-DD. */
function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Midnight at the start of the given day, in the device's timezone. */
function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Cards ready to review right now. */
export async function getDueCount(): Promise<number> {
  const { count, error } = await supabase
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .lte('due_date', new Date().toISOString());

  if (error) throw error;
  return count ?? 0;
}

/**
 * Consecutive days reviewed, counting back from today.
 *
 * Days are bucketed by LOCAL date. Using a UTC day key would mis-file
 * late-night reviews for anyone west of UTC — a 23:30 review in Manila is
 * already "tomorrow" in UTC, which silently breaks the streak.
 *
 * Today not yet being reviewed does not break the streak; it only stops it
 * growing. Otherwise the number would read zero every morning.
 */
export async function getStreak(): Promise<number> {
  const { data, error } = await supabase
    .from('review_logs')
    .select('reviewed_at')
    .order('reviewed_at', { ascending: false })
    .limit(365);

  if (error) throw error;
  if (!data?.length) return 0;

  const days = new Set(data.map((row) => localDayKey(new Date(row.reviewed_at))));

  const today = new Date();
  let cursor = days.has(localDayKey(today)) ? today : addDays(today, -1);

  // If neither today nor yesterday has a review, the run has already ended.
  if (!days.has(localDayKey(cursor))) return 0;

  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/** Reviews logged since local midnight. */
export async function getReviewedToday(): Promise<number> {
  const { count, error } = await supabase
    .from('review_logs')
    .select('id', { count: 'exact', head: true })
    .gte('reviewed_at', startOfLocalDay(new Date()).toISOString());

  if (error) throw error;
  return count ?? 0;
}

export interface DayReviews {
  /** Local YYYY-MM-DD. */
  day: string;
  /** Single-letter label for the bar chart, Mon-first in the device locale. */
  label: string;
  count: number;
}

/**
 * Reviews per day for the last 7 local days, oldest first.
 *
 * Bucketed client-side. Postgres could group this, but date_trunc would run in
 * the database's timezone rather than the device's, reintroducing the same
 * off-by-one-day problem getStreak avoids.
 */
export async function getWeekReviews(): Promise<DayReviews[]> {
  const today = startOfLocalDay(new Date());
  const from = addDays(today, -6);

  const { data, error } = await supabase
    .from('review_logs')
    .select('reviewed_at')
    .gte('reviewed_at', from.toISOString());

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = localDayKey(new Date(row.reviewed_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    const key = localDayKey(date);
    return {
      day: key,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      count: counts.get(key) ?? 0,
    };
  });
}

export interface DueDeck {
  id: string;
  title: string;
  dueCount: number;
  cardCount: number;
}

/**
 * Decks with their due and total counts, most-due first.
 *
 * One query with an embedded flashcards array, rather than a count per deck:
 * a deck list is small, and N+1 round trips over mobile data is the wrong
 * trade. If decks ever grow large enough for this to hurt, move it to a
 * Postgres view or an RPC.
 */
export async function getDueDecks(limit = 3): Promise<DueDeck[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('id, title, flashcards(id, due_date)');

  if (error) throw error;

  const now = Date.now();

  return (data ?? [])
    .map((deck) => {
      const cards = (deck.flashcards ?? []) as { id: string; due_date: string }[];
      return {
        id: deck.id,
        title: deck.title,
        cardCount: cards.length,
        dueCount: cards.filter((c) => new Date(c.due_date).getTime() <= now).length,
      };
    })
    .sort((a, b) => b.dueCount - a.dueCount || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/**
 * First name for the greeting.
 *
 * There is no profiles table in this schema, so this reads the auth user's
 * metadata — populated by the OAuth provider — and falls back to the local part
 * of the email address.
 */
export async function getFirstName(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const user = data.user;
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const full =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    '';

  if (full.trim()) return full.trim().split(/\s+/)[0];
  if (user.email) return user.email.split('@')[0];
  return null;
}
