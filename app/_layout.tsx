import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import { SessionProvider } from '@/lib/SessionContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorFallback } from '@/components/ErrorFallback';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  Sentry.captureException(error);
  return <ErrorFallback error={error} retry={retry} />;
}

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create/profile" />
          <Stack.Screen name="create/services" />
          <Stack.Screen name="create/filters" />
          <Stack.Screen name="create/lobby" />
          <Stack.Screen name="join/enter-code" />
          <Stack.Screen name="join/lobby" />
          <Stack.Screen name="(session)" options={{ gestureEnabled: false }} />
        </Stack>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
