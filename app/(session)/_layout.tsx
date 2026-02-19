import React from 'react';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { ErrorFallback } from '@/components/ErrorFallback';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  Sentry.captureException(error);
  return <ErrorFallback error={error} retry={retry} />;
}

export default function SessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="swipe" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="group" />
    </Stack>
  );
}
