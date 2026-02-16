import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export function ErrorFallback({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning-outline" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message || 'An unexpected error occurred.'}</Text>
      {retry && (
        <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.8}>
          <Ionicons name="refresh" size={18} color={Colors.white} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function InlineError({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <View style={styles.inlineBanner}>
      <Ionicons name="alert-circle" size={18} color={Colors.primary} />
      <Text style={styles.inlineText} numberOfLines={2}>
        {message}
      </Text>
      {retry && (
        <TouchableOpacity onPress={retry}>
          <Ionicons name="refresh" size={18} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(227, 6, 19, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  inlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(227, 6, 19, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  inlineText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
});
