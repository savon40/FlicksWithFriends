import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import {
  GENRES,
  MOODS,
  RUNTIME_OPTIONS,
  YEAR_OPTIONS,
  RATING_OPTIONS,
  CERTIFICATION_OPTIONS,
  CONTENT_TYPES,
} from '@/lib/constants';
import * as Sentry from '@sentry/react-native';
import { getDeviceId } from '@/lib/device';
import {
  generateUniqueCode,
  createSession,
  seedCatalog,
  addParticipant,
} from '@/lib/sessionService';
import { buildCatalog } from '@/lib/tmdb';

export default function FiltersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    filters,
    updateFilter,
    selectedServices,
    nickname,
    avatarSeed,
    setSessionCode,
    setSessionId,
    setParticipantId,
    setMatchThreshold,
  } = useSession();
  const [creating, setCreating] = useState(false);

  const toggleGenre = (genre: string) => {
    const current = filters.genres;
    updateFilter(
      'genres',
      current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre]
    );
  };

  const handleGenerateCode = async () => {
    if (creating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCreating(true);
    try {
      const deviceId = await getDeviceId();
      Sentry.setUser({ id: deviceId });

      const code = await generateUniqueCode();

      const session = await createSession({
        code,
        deviceId,
        streamingServices: selectedServices,
        filters,
      });

      const catalog = await buildCatalog(filters, selectedServices);

      if (catalog.length === 0) {
        Alert.alert('No Results', 'No titles found matching your filters. Try broadening your selections.');
        setCreating(false);
        return;
      }

      await seedCatalog(session.id, catalog);

      const participant = await addParticipant({
        sessionId: session.id,
        deviceId,
        nickname: nickname || 'Host',
        isHost: true,
        avatarSeed,
      });

      setSessionCode(session.code);
      setSessionId(session.id);
      setParticipantId(participant.id);
      setMatchThreshold(session.matchThreshold);
      Sentry.addBreadcrumb({
        category: 'session',
        message: `Created session ${session.code} with ${catalog.length} items`,
        level: 'info',
      });
      router.push('/create/lobby');
    } catch (e: any) {
      Sentry.captureException(e, { tags: { action: 'createSession' } });
      Alert.alert('Error', e.message ?? 'Could not create session');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <Text style={styles.headerTitle}>Set Filters</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Type</Text>
          <View style={styles.toggleRow}>
            {CONTENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.togglePill,
                  filters.contentType === type.id && styles.togglePillActive,
                ]}
                onPress={() => updateFilter('contentType', type.id)}
              >
                <Text
                  style={[
                    styles.togglePillText,
                    filters.contentType === type.id && styles.togglePillTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Genres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres</Text>
          <View style={styles.chipGrid}>
            {GENRES.map((genre) => {
              const isSelected = filters.genres.includes(genre);
              return (
                <TouchableOpacity
                  key={genre}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggleGenre(genre)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Animation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animation</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                filters.animation === 'include' && styles.togglePillActive,
              ]}
              onPress={() =>
                updateFilter('animation', filters.animation === 'include' ? null : 'include')
              }
            >
              <Text
                style={[
                  styles.togglePillText,
                  filters.animation === 'include' && styles.togglePillTextActive,
                ]}
              >
                Include
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.togglePill,
                filters.animation === 'exclude' && styles.togglePillActive,
              ]}
              onPress={() =>
                updateFilter('animation', filters.animation === 'exclude' ? null : 'exclude')
              }
            >
              <Text
                style={[
                  styles.togglePillText,
                  filters.animation === 'exclude' && styles.togglePillTextActive,
                ]}
              >
                Exclude
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mood */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood</Text>
          <View style={styles.chipGrid}>
            {MOODS.map((mood) => {
              const isSelected = filters.mood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[styles.chip, styles.moodChip, isSelected && styles.chipActive]}
                  onPress={() => updateFilter('mood', isSelected ? null : mood.id)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Runtime */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Runtime</Text>
          <View style={styles.toggleRow}>
            {RUNTIME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.togglePill,
                  filters.runtimeRange === opt.id && styles.togglePillActive,
                ]}
                onPress={() => updateFilter('runtimeRange', opt.id)}
              >
                <Text
                  style={[
                    styles.togglePillText,
                    filters.runtimeRange === opt.id && styles.togglePillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Release Year */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Release Year</Text>
          <View style={styles.chipGrid}>
            {YEAR_OPTIONS.filter((opt) => opt.id !== 'any').map((opt) => {
              const isSelected = filters.releaseYearRange.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.chip,
                    isSelected && styles.chipActive,
                  ]}
                  onPress={() =>
                    updateFilter(
                      'releaseYearRange',
                      isSelected
                        ? filters.releaseYearRange.filter((y) => y !== opt.id)
                        : [...filters.releaseYearRange, opt.id]
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Min Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Rating</Text>
          <View style={styles.toggleRow}>
            {RATING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.togglePill,
                  filters.minRating === opt.value && styles.togglePillActive,
                ]}
                onPress={() => updateFilter('minRating', opt.value)}
              >
                <Text
                  style={[
                    styles.togglePillText,
                    filters.minRating === opt.value && styles.togglePillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Certification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certification</Text>
          <View style={styles.toggleRow}>
            {CERTIFICATION_OPTIONS.map((opt) => {
              const isSelected = filters.certifications.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.togglePill,
                    isSelected && styles.togglePillActive,
                  ]}
                  onPress={() =>
                    updateFilter(
                      'certifications',
                      isSelected
                        ? filters.certifications.filter((c) => c !== opt.id)
                        : [...filters.certifications, opt.id]
                    )
                  }
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      isSelected && styles.togglePillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Generate Code Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.generateButton, creating && { opacity: 0.6 }]}
          onPress={handleGenerateCode}
          activeOpacity={0.8}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Ionicons name="sparkles" size={20} color={Colors.white} />
          )}
          <Text style={styles.generateButtonText}>
            {creating ? 'Creating...' : 'Generate Group Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
  chipTextActive: {
    color: Colors.white,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: {
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  togglePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  togglePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  togglePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
  togglePillTextActive: {
    color: Colors.white,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 54,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
