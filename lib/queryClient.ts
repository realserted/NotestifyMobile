import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Shared query client.
 *
 * TanStack's focus tracking is written for the web's `visibilitychange`, which
 * does not exist here, so foreground state has to be forwarded manually or
 * refetch-on-focus never fires.
 */
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Review counts change as the user works, but not second to second.
      // Half a minute keeps tab switches instant without serving stale figures.
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

/** Query keys, kept in one place so mutations can invalidate precisely. */
export const keys = {
  dashboard: ['dashboard'] as const,
  dueCount: ['dashboard', 'dueCount'] as const,
  streak: ['dashboard', 'streak'] as const,
  reviewedToday: ['dashboard', 'reviewedToday'] as const,
  weekReviews: ['dashboard', 'weekReviews'] as const,
  dueDecks: ['dashboard', 'dueDecks'] as const,
  decks: ['decks'] as const,
};
