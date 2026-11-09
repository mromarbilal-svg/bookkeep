import { ThemeProvider } from '@/lib/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Bookkeep' }} />
        <Stack.Screen name="transactions" options={{ title: 'Transactions' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </ThemeProvider>
  );
}