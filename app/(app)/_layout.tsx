import { Stack } from 'expo-router';

/**
 * Navigator for authenticated screens. The root layout guarantees a session
 * exists before anything here renders, so screens under (app) can assume the
 * user is signed in.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Notestify' }} />
    </Stack>
  );
}
