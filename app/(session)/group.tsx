import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { InlineError } from '@/components/ErrorFallback';
import { AVATARS } from '@/lib/constants';
import { useParticipants } from '@/hooks/useParticipants';
import { useCatalog } from '@/hooks/useCatalog';

export default function GroupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessionCode, sessionId, resetSession } = useSession();
  const { participants, error: participantsError, retry: retryParticipants } = useParticipants(sessionId);
  const { catalog } = useCatalog(sessionId);
  const totalCards = catalog.length;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join my Flicks With Friends session! Code: ${sessionCode || ''}`,
      });
    } catch (e: any) {
      if (e?.message && !e.message.includes('cancel')) {
        Sentry.captureException(e, { tags: { action: 'shareSession' } });
      }
    }
  };

  const handleCopyCode = async () => {
    if (!sessionCode) return;
    try {
      await Clipboard.setStringAsync(sessionCode);
    } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveSession}>
          <Ionicons name="arrow-back" size={18} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color={Colors.primary} />
          <Text style={styles.shareBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {participantsError && <InlineError message={participantsError} retry={retryParticipants} />}

      {/* Session Info */}
      <View style={styles.sessionCard}>
        <TouchableOpacity style={styles.sessionRow} onPress={handleCopyCode} activeOpacity={0.7}>
          <Text style={styles.sessionLabel}>Session Code</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.sessionCode}>{sessionCode || ''}</Text>
            <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? Colors.green : Colors.muted} />
          </View>
        </TouchableOpacity>
        <View style={styles.divider} />
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Status</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Catalog Size</Text>
          <Text style={styles.sessionValue}>{totalCards} titles</Text>
        </View>
      </View>

      {/* Participants */}
      <Text style={styles.sectionTitle}>
        Participants ({participants.length})
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
              <View style={styles.nameRow}>
                <Text style={styles.participantName}>{item.nickname}</Text>
                {item.isHost && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>HOST</Text>
                  </View>
                )}
              </View>
              <View style={styles.progressRow}>
                <View style={styles.miniProgress}>
                  <View
                    style={[
                      styles.miniProgressFill,
                      { width: `${totalCards > 0 ? (item.swipeProgress / totalCards) * 100 : 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {item.swipeProgress}/{totalCards}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: Colors.green },
              ]}
            />
          </View>
        )}
        contentContainerStyle={styles.participantList}
      />

      {/* Leave Session */}
      <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveSession} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={18} color={Colors.primary} />
        <Text style={styles.leaveBtnText}>Leave Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
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
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.foreground,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 188, 212, 0.08)',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  sessionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sessionLabel: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '500',
  },
  sessionCode: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.foreground,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  sessionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.green,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  participantList: {
    gap: 8,
    paddingBottom: 100,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.mutedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  participantInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  participantName: {
    fontSize: 16,
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgress: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedLight,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 188, 212, 0.04)',
  },
  leaveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
