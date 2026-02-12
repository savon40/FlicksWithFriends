import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import { STREAMING_SERVICES } from '@/lib/constants';
import { CatalogItem } from '@/types';
import { useSession } from '@/lib/SessionContext';
import { useCatalog } from '@/hooks/useCatalog';
import { useParticipants } from '@/hooks/useParticipants';
import { recordSwipe, updateSwipeProgress } from '@/lib/sessionService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function SwipeScreen() {
  const insets = useSafeAreaInsets();
  const { sessionId, sessionCode, participantId } = useSession();
  const { catalog, loading: catalogLoading } = useCatalog(sessionId);
  const { participants } = useParticipants(sessionId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardStartTime = useRef(Date.now());

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const currentCard = catalog[currentIndex];
  const nextCard = catalog[currentIndex + 1];

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (!participantId || !sessionId || !catalog[currentIndex]) return;
      const timeOnCardMs = Date.now() - cardStartTime.current;
      const catalogItem = catalog[currentIndex];
      // Fire and forget
      recordSwipe({
        participantId,
        catalogItemId: catalogItem.id,
        sessionId,
        direction,
        timeOnCardMs,
      }).catch(() => {});
      updateSwipeProgress(participantId, currentIndex + 1).catch(() => {});
    },
    [participantId, sessionId, catalog, currentIndex]
  );

  const goToNext = useCallback(
    (direction: 'left' | 'right') => {
      handleSwipeComplete(direction);
      setCurrentIndex((prev) => Math.min(prev + 1, catalog.length));
      translateX.value = 0;
      translateY.value = 0;
      cardStartTime.current = Date.now();
    },
    [catalog.length, handleSwipeComplete]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const dir = translateX.value > 0 ? 1 : -1;
        const swipeDir: 'left' | 'right' = dir > 0 ? 'right' : 'left';
        translateX.value = withTiming(dir * SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(goToNext)(swipeDir);
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.95, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    const target = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(target, { duration: 400 }, () => {
      runOnJS(goToNext)(direction);
    });
  };

  const progress = ((currentIndex + 1) / catalog.length) * 100;

  const getAvatarColor = (seed: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[seed % colors.length];
  };

  if (catalogLoading) {
    return (
      <View style={[styles.container, styles.doneContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.doneSubtitle}>Loading movies...</Text>
      </View>
    );
  }

  if (currentIndex >= catalog.length) {
    return (
      <View style={[styles.container, styles.doneContainer, { paddingTop: insets.top }]}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
        <Text style={styles.doneTitle}>All Done!</Text>
        <Text style={styles.doneSubtitle}>
          You've swiped through all the movies. Check the Matches tab to see results.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sessionLabel}>MOVIE NIGHT</Text>
          <Text style={styles.sessionTitle}>Session {sessionCode ? `#${sessionCode}` : ''}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatarStack}>
            {participants.slice(0, 3).map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.miniAvatar,
                  {
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: 3 - i,
                    backgroundColor: getAvatarColor(p.avatarSeed),
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.white }}>
                  {p.nickname[0]}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>{participants.length} Active</Text>
          </View>
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {/* Next Card (underneath) */}
        {nextCard && (
          <Animated.View style={[styles.card, styles.nextCard, nextCardStyle]}>
            <MovieCard item={nextCard} />
          </Animated.View>
        )}

        {/* Current Card */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            {/* Swipe Labels */}
            <Animated.View style={[styles.swipeLabel, styles.likeLabel, likeOpacity]}>
              <Text style={styles.swipeLabelText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.swipeLabel, styles.nopeLabel, nopeOpacity]}>
              <Text style={[styles.swipeLabelText, styles.nopeLabelText]}>NOPE</Text>
            </Animated.View>
            <MovieCard item={currentCard} />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.dislikeButton}
          onPress={() => handleButtonSwipe('left')}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={Colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => handleButtonSwipe('right')}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Counter */}
      <Text style={styles.counter}>
        {currentIndex + 1} / {catalog.length}
      </Text>
    </View>
  );
}

function MovieCard({ item }: { item: CatalogItem }) {
  const service = STREAMING_SERVICES.find((s) => item.availableOn.includes(s.id));

  const formatRuntime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  return (
    <View style={styles.movieCard}>
      <Image source={{ uri: item.posterUrl }} style={styles.posterImage} />

      {/* Streaming badge */}
      {service && (
        <View style={[styles.streamingBadge, { backgroundColor: service.color }]}>
          <Text style={styles.streamingBadgeText}>{service.logo}</Text>
        </View>
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
      />

      {/* Movie Info */}
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{item.title}</Text>
        <View style={styles.metaRow}>
          {item.genres.slice(0, 1).map((g) => (
            <View key={g} style={styles.genreTag}>
              <Text style={styles.genreTagText}>{g}</Text>
            </View>
          ))}
          <Text style={styles.metaText}> · {formatRuntime(item.runtime)}</Text>
          <Text style={styles.metaText}> · </Text>
          <Ionicons name="star-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.metaText}> {item.tmdbRating}</Text>
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
  doneContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.foreground,
  },
  doneSubtitle: {
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sessionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedLight,
    letterSpacing: 1.5,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.foreground,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.green,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.foreground,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.58,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  nextCard: {
    opacity: 0.6,
  },
  movieCard: {
    flex: 1,
  },
  posterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  streamingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  streamingBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  movieInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  movieTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  genreTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  swipeLabel: {
    position: 'absolute',
    top: 40,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeLabel: {
    left: 20,
    borderColor: Colors.green,
    transform: [{ rotate: '-15deg' }],
  },
  nopeLabel: {
    right: 20,
    borderColor: Colors.primary,
    transform: [{ rotate: '15deg' }],
  },
  swipeLabelText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.green,
    letterSpacing: 2,
  },
  nopeLabelText: {
    color: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  dislikeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedLight,
    textAlign: 'center',
    paddingBottom: 4,
  },
});
