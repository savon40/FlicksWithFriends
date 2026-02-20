import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import Colors from '@/constants/Colors';
import { Match } from '@/types';
import { InlineError } from '@/components/ErrorFallback';
import { STREAMING_SERVICES, AVATARS } from '@/lib/constants';
import { useSession } from '@/lib/SessionContext';
import { useMatches } from '@/hooks/useMatches';
import { useParticipants } from '@/hooks/useParticipants';
import { updateSessionStatus, selectSessionWinner } from '@/lib/sessionService';

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessionId, matchThreshold, isHost, resetSession } = useSession();
  const { matches, loading, error: matchesError, retry: retryMatches } = useMatches(sessionId, matchThreshold);
  const { participants } = useParticipants(sessionId);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const topMatch = matches[0];
  const otherMatches = matches.slice(1);

  const handleSelectMatch = (catalogItemId: string) => {
    if (!isHost) return;
    setSelectedMatchId(catalogItemId);
  };

  const finalizeDisabled = !selectedMatchId;

  const handleLeaveSession = () => {
    Alert.alert('Leave Session', 'Are you sure you want to leave this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          resetSession();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const handleFinalize = async () => {
    if (!sessionId) return;
    if (finalizeDisabled) return;
    try {
      if (selectedMatchId) {
        await selectSessionWinner(sessionId, selectedMatchId);
      }
      await updateSessionStatus(sessionId, 'completed');
    } catch (e: any) {
      Sentry.captureException(e, { tags: { action: 'finalizeSession' } });
    }
    resetSession();
    router.replace('/(tabs)/history');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Leave button */}
      <View style={styles.leaveHeader}>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveSession}>
          <Ionicons name="arrow-back" size={18} color={Colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <View style={styles.celebrationHeader}>
          <View style={styles.sparkleIcon}>
            <Ionicons name="sparkles" size={32} color={Colors.white} />
          </View>
          <Text style={styles.matchTitle}>
            {loading ? 'Calculating...' : matches.length > 0 ? "It's a Match!" : 'No Matches Yet'}
          </Text>
          <Text style={styles.matchSubtitle}>
            {matches.length > 0
              ? 'You and your group have agreed on these top picks.'
              : 'Keep swiping! Matches will appear when the group agrees.'}
          </Text>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
        )}

        {matchesError && <InlineError message={matchesError} retry={retryMatches} />}

        {/* Top Match Card */}
        {topMatch && (
          <TouchableOpacity
            activeOpacity={isHost ? 0.7 : 1}
            onPress={() => handleSelectMatch(topMatch.catalogItemId)}
          >
            <TopMatchCard
              match={topMatch}
              participants={participants}
              selected={selectedMatchId === topMatch.catalogItemId}
            />
          </TouchableOpacity>
        )}

        {/* Other Matches */}
        {otherMatches.map((match, index) => (
          <TouchableOpacity
            key={match.catalogItemId}
            activeOpacity={isHost ? 0.7 : 1}
            onPress={() => handleSelectMatch(match.catalogItemId)}
          >
            <SecondaryMatchCard
              match={match}
              rank={index + 2}
              selected={selectedMatchId === match.catalogItemId}
            />
          </TouchableOpacity>
        ))}

        <Text style={styles.tmdbAttribution}>Data provided by TMDB</Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {isHost ? (
          <>
            <TouchableOpacity
              style={[styles.finalizeButton, finalizeDisabled && styles.finalizeButtonDisabled]}
              activeOpacity={finalizeDisabled ? 1 : 0.8}
              onPress={handleFinalize}
              disabled={finalizeDisabled}
            >
              <Text style={styles.finalizeButtonText}>Finalize & Watch</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
            {finalizeDisabled && (
              <Text style={styles.selectHintText}>Tap a match to select your pick</Text>
            )}
          </>
        ) : (
          <Text style={styles.waitingForHostText}>Waiting for host to finalize pick...</Text>
        )}
      </View>
    </View>
  );
}

function TopMatchCard({
  match,
  participants,
  selected,
}: {
  match: Match;
  participants: { id: string; avatarSeed: number; nickname: string }[];
  selected: boolean;
}) {
  return (
    <View style={[styles.topCard, selected && styles.selectedCard]}>
      {/* Gold glow border */}
      <View style={styles.topCardInner}>
        {selected && (
          <View style={styles.selectedCheckmark}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          </View>
        )}
        {/* Badges */}
        <View style={styles.topBadgeRow}>
          <View style={styles.topPickBadge}>
            <Text style={styles.topPickText}>TOP PICK</Text>
          </View>
          <View style={styles.favoriteBadge}>
            <Ionicons name="trophy" size={14} color={Colors.gold} />
            <Text style={styles.favoriteText}>Group Favorite</Text>
          </View>
          <Text style={styles.genreInfo} numberOfLines={1}>
            {match.genres.join(' · ')}
          </Text>
        </View>

        {/* Movie Info Row */}
        <View style={styles.topMovieRow}>
          <Image source={match.posterUrl} style={styles.topPoster} contentFit="cover" transition={200} />
          <View style={styles.topMovieInfo}>
            <Text style={styles.topMovieTitle}>{match.title}</Text>
            <Text style={styles.topMovieSynopsis} numberOfLines={2}>
              {match.synopsis}
            </Text>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={16} color={Colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.topStats}>
          <View style={styles.statsRow}>
            <Text style={styles.voteText}>
              ({match.rightSwipeCount}/{match.totalParticipants} Voted Yes)
            </Text>
            <Ionicons name="people-outline" size={16} color={Colors.muted} />
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${match.matchPercentage * 100}%`, backgroundColor: Colors.primary },
              ]}
            />
          </View>
          {/* Avatar stack */}
          <View style={styles.avatarStack}>
            {participants.map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.smallAvatar,
                  {
                    marginLeft: i > 0 ? -8 : 0,
                    backgroundColor: Colors.mutedBackground,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={{ fontSize: 12 }}>
                  {AVATARS[p.avatarSeed % AVATARS.length].emoji}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function SecondaryMatchCard({ match, rank, selected }: { match: Match; rank: number; selected: boolean }) {
  const barColor =
    match.tier === 'strong' ? Colors.orange : match.tier === 'soft' ? Colors.muted : Colors.primary;

  return (
    <View style={[styles.secondaryCard, rank > 2 && { opacity: 0.8 }, selected && styles.selectedCard]}>
      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        {selected ? (
          <Ionicons name="checkmark" size={14} color={Colors.primary} />
        ) : (
          <Text style={styles.rankText}>{rank}</Text>
        )}
      </View>

      <Image source={match.posterUrl} style={styles.secondaryPoster} contentFit="cover" transition={200} />

      <View style={styles.secondaryInfo}>
        <View style={styles.secondaryHeader}>
          <View>
            <Text style={styles.secondaryTitle}>{match.title}</Text>
            <Text style={styles.secondaryGenre}>{match.genres.join(' · ')}</Text>
          </View>
          <Text style={styles.secondaryRuntime}>{match.runtime}m</Text>
        </View>

        {match.tier === 'soft' && (
          <Text style={styles.matchPercentText}>
            {Math.round(match.matchPercentage * 100)}% Match
          </Text>
        )}

        <View style={styles.secondaryStatsRow}>
          <View style={styles.secondaryProgressContainer}>
            <View
              style={[
                styles.secondaryProgressFill,
                {
                  width: `${match.matchPercentage * 100}%`,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
          <Text style={styles.secondaryVoteText}>
            {match.rightSwipeCount}/{match.totalParticipants}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  leaveHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  leaveButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  matchTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.foreground,
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Top Match Card
  topCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    marginBottom: 16,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  topCardInner: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  topPickBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  topPickText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  favoriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.goldDark,
  },
  genreInfo: {
    fontSize: 12,
    color: Colors.muted,
    marginLeft: 'auto',
    flexShrink: 1,
  },
  topMovieRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  topPoster: {
    width: 90,
    height: 130,
    borderRadius: 12,
    backgroundColor: Colors.mutedBackground,
  },
  topMovieInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  topMovieTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.foreground,
    marginBottom: 6,
  },
  topMovieSynopsis: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.mutedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  topStats: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voteText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  // Secondary Match Cards
  secondaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
  },
  secondaryPoster: {
    width: 80,
    height: 110,
    borderRadius: 10,
    backgroundColor: Colors.mutedBackground,
    marginRight: 12,
  },
  secondaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  secondaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  secondaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.foreground,
  },
  secondaryGenre: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  secondaryRuntime: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '500',
  },
  matchPercentText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 6,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  secondaryProgressContainer: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  secondaryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  secondaryVoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  finalizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 56,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  finalizeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  tmdbAttribution: {
    fontSize: 10,
    color: Colors.mutedLight,
    textAlign: 'center',
    marginTop: 16,
  },
  finalizeButtonDisabled: {
    opacity: 0.4,
  },
  selectHintText: {
    fontSize: 13,
    color: Colors.mutedLight,
    textAlign: 'center',
    marginTop: 8,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  waitingForHostText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
