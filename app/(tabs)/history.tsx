import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { STREAMING_SERVICES } from '@/lib/constants';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { SessionHistoryItem } from '@/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function HistoryCard({ item }: { item: SessionHistoryItem }) {
  const matchService = item.topMatch?.availableOn?.[0]
    ? STREAMING_SERVICES.find((s) => s.id === item.topMatch!.availableOn[0])
    : null;

  return (
    <View style={styles.card}>
      {/* Poster thumbnail */}
      <View style={styles.posterContainer}>
        {item.topMatch?.posterUrl ? (
          <Image
            source={item.topMatch.posterUrl}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="film-outline" size={28} color={Colors.mutedLight} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.sessionCode}>#{item.sessionCode}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.topMatch ? (
          <>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {item.topMatch.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.matchBadge}>
                <Ionicons name="flame" size={12} color={Colors.primary} />
                <Text style={styles.matchText}>
                  {Math.round(item.topMatch.matchPercentage)}%
                </Text>
              </View>
              {matchService && (
                <View style={[styles.servicePill, { backgroundColor: matchService.color }]}>
                  <Text style={styles.servicePillText}>{matchService.name}</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <Text style={styles.noMatchText}>No matches yet</Text>
        )}

        <View style={styles.participantRow}>
          <Ionicons name="people-outline" size={14} color={Colors.muted} />
          <Text style={styles.participantText}>
            {item.participantCount} participant{item.participantCount !== 1 ? 's' : ''}
          </Text>
          <View
            style={[
              styles.statusChip,
              item.status === 'active' ? styles.statusActive : styles.statusCompleted,
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                item.status === 'active'
                  ? styles.statusActiveText
                  : styles.statusCompletedText,
              ]}
            >
              {item.status === 'active' ? 'Active' : 'Completed'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, loading, refresh } = useSessionHistory();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (loading && sessions.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.headerTitle}>History</Text>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={56} color={Colors.mutedLight} />
          <Text style={styles.emptyTitle}>No Past Sessions</Text>
          <Text style={styles.emptySubtitle}>
            Sessions you participate in will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.sessionId}
          renderItem={({ item }) => <HistoryCard item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.foreground,
    marginBottom: 20,
  },
  list: {
    gap: 12,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  posterContainer: {
    marginRight: 12,
  },
  poster: {
    width: 64,
    height: 96,
    borderRadius: 10,
  },
  posterPlaceholder: {
    backgroundColor: Colors.mutedBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionCode: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 12,
    color: Colors.mutedLight,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 6,
  },
  noMatchText: {
    fontSize: 14,
    color: Colors.mutedLight,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(227, 6, 19, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  servicePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantText: {
    fontSize: 12,
    color: Colors.muted,
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusCompleted: {
    backgroundColor: Colors.mutedBackground,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusActiveText: {
    color: Colors.green,
  },
  statusCompletedText: {
    color: Colors.muted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
});
