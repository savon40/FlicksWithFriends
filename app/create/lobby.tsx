import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Share,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import {
  STREAMING_SERVICES,
  AVATARS,
  MOODS,
  RUNTIME_OPTIONS,
  YEAR_OPTIONS,
  CONTENT_TYPES,
} from '@/lib/constants';
import { useParticipants } from '@/hooks/useParticipants';
import { updateSessionStatus } from '@/lib/sessionService';
import { getDiscoverPreviewUrls } from '@/lib/tmdb';

export default function HostLobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionCode, sessionId, selectedServices, filters } = useSession();
  const { participants } = useParticipants(sessionId);
  const [copied, setCopied] = useState(false);
  const [apiExpanded, setApiExpanded] = useState(false);
  const [apiCopied, setApiCopied] = useState(false);

  const previewUrls = getDiscoverPreviewUrls(filters, selectedServices);

  const handleCopyCode = async () => {
    if (!sessionCode) return;
    await Clipboard.setStringAsync(sessionCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join my FlickPick session! Code: ${sessionCode}`,
      });
    } catch {}
  };

  const handleStartSwiping = async () => {
    if (!sessionId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateSessionStatus(sessionId, 'active');
      router.replace('/(session)/swipe');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not start session');
    }
  };

  const selectedServiceNames = selectedServices
    .map((id) => STREAMING_SERVICES.find((s) => s.id === id)?.name)
    .filter(Boolean);

  // Build filter summary tags
  const filterTags: string[] = [];
  const contentLabel = CONTENT_TYPES.find((c) => c.id === filters.contentType)?.label;
  if (contentLabel && filters.contentType !== 'movies') filterTags.push(contentLabel);
  filters.genres.forEach((g) => filterTags.push(g));
  const moodObj = MOODS.find((m) => m.id === filters.mood);
  if (moodObj) filterTags.push(`${moodObj.emoji} ${moodObj.label}`);
  const runtimeLabel = RUNTIME_OPTIONS.find((r) => r.id === filters.runtimeRange)?.label;
  if (runtimeLabel && filters.runtimeRange !== 'any') filterTags.push(runtimeLabel);
  const yearLabel = YEAR_OPTIONS.find((y) => y.id === filters.releaseYearRange)?.label;
  if (yearLabel && filters.releaseYearRange !== 'any') filterTags.push(yearLabel);
  if (filters.minRating && filters.minRating > 0) filterTags.push(`${filters.minRating}+ Rating`);
  if (filters.certifications.length > 0) filterTags.push(`Rated ${filters.certifications.join(', ')}`);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Session</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Code Display */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>GROUP CODE</Text>
        <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
          <View style={styles.codeDisplay}>
            {(sessionCode || 'FILM42').split('').map((char, i) => (
              <View key={i} style={styles.codeChar}>
                <Text style={styles.codeCharText}>{char}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
        <Text style={styles.copiedHint}>{copied ? 'Copied!' : 'Tap code to copy'}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color={Colors.primary} />
          <Text style={styles.shareButtonText}>Share Code</Text>
        </TouchableOpacity>
      </View>

      {/* Services */}
      <View style={styles.servicesRow}>
        {selectedServiceNames.slice(0, 4).map((name, i) => (
          <View key={i} style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>{name}</Text>
          </View>
        ))}
        {selectedServiceNames.length > 4 && (
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>+{selectedServiceNames.length - 4}</Text>
          </View>
        )}
      </View>

      {/* Filter Selections */}
      {filterTags.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Filters</Text>
          <View style={styles.filterTagsRow}>
            {filterTags.map((tag, i) => (
              <View key={i} style={styles.filterTag}>
                <Text style={styles.filterTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* API Preview */}
      <View style={styles.apiSection}>
        <TouchableOpacity
          style={styles.apiHeader}
          onPress={() => setApiExpanded(!apiExpanded)}
          activeOpacity={0.7}
        >
          <Ionicons name="code-slash" size={14} color={Colors.muted} />
          <Text style={styles.apiHeaderText}>TMDB API Call</Text>
          <Ionicons
            name={apiExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.muted}
          />
        </TouchableOpacity>
        {apiExpanded && (
          <View style={styles.apiBody}>
            {previewUrls.map((url, i) => (
              <TouchableOpacity
                key={i}
                onPress={async () => {
                  await Clipboard.setStringAsync(url);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setApiCopied(true);
                  setTimeout(() => setApiCopied(false), 2000);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.apiUrlBox}>
                  <Text style={styles.apiUrlLabel}>
                    {url.includes('/discover/movie') ? 'Movie' : 'TV'} Discover
                  </Text>
                  <Text style={styles.apiUrlText} numberOfLines={6}>
                    {url}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <Text style={styles.apiHint}>
              {apiCopied ? 'Copied!' : 'Tap URL to copy'}
            </Text>
          </View>
        )}
      </View>

      {/* Participants */}
      <View style={styles.participantsSection}>
        <Text style={styles.participantsTitle}>
          Waiting Room ({participants.length})
        </Text>
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.participantRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {AVATARS[item.avatarSeed % AVATARS.length].emoji}
                </Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{item.nickname}</Text>
                {item.isHost && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>HOST</Text>
                  </View>
                )}
              </View>
              <View style={styles.onlineIndicator} />
            </View>
          )}
          contentContainerStyle={styles.participantList}
        />
      </View>

      {/* Start Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartSwiping}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Swiping</Text>
          <Ionicons name="play" size={20} color={Colors.white} />
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
  },
  codeSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  codeDisplay: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  codeChar: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  codeCharText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.foreground,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copiedHint: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedLight,
    marginBottom: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 188, 212, 0.08)',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  serviceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  filterTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 188, 212, 0.08)',
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  apiSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  apiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  apiHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  apiBody: {
    marginTop: 4,
  },
  apiUrlBox: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 10,
    marginBottom: 6,
  },
  apiUrlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  apiUrlText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.muted,
    lineHeight: 15,
  },
  apiHint: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedLight,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  participantsSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  participantList: {
    gap: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mutedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.foreground,
  },
  hostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.green,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  startButton: {
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
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  waitingText: {
    fontSize: 13,
    color: Colors.mutedLight,
    textAlign: 'center',
    marginTop: 8,
  },
});
