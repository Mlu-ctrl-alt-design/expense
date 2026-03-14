import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#2563EB',
          headerTitleStyle: { fontWeight: '600', color: '#111827' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#F9FAFB' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="review" options={{ title: 'Review Expense', headerBackTitle: 'Retake' }} />
        <Stack.Screen name="confirm" options={{ title: 'Submitted!', headerLeft: () => null }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
