import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { useParticipants } from '@/hooks/useParticipants';
import { useCatalog } from '@/hooks/useCatalog';

export default function GroupScreen() {
  const insets = useSafeAreaInsets();
  const { sessionCode, sessionId } = useSession();
  const { participants } = useParticipants(sessionId);
  const { catalog } = useCatalog(sessionId);
  const totalCards = catalog.length;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my FlickPick session! Code: ${sessionCode || 'FILM42'}`,
      });
    } catch {}
  };

  const getAvatarColor = (seed: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[seed % colors.length];
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Group</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color={Colors.primary} />
          <Text style={styles.shareBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      <View style={styles.sessionCard}>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Session Code</Text>
          <Text style={styles.sessionCode}>{sessionCode || 'FILM42'}</Text>
        </View>
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
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.avatarSeed) }]}>
              <Text style={styles.avatarText}>{item.nickname[0]}</Text>
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
                      { width: `${(item.swipeProgress / totalCards) * 100}%` },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
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
    backgroundColor: 'rgba(227, 6, 19, 0.08)',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
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
    backgroundColor: 'rgba(227, 6, 19, 0.1)',
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
});
