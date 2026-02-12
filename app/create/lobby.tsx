import React from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { STREAMING_SERVICES } from '@/lib/constants';
import { useParticipants } from '@/hooks/useParticipants';
import { updateSessionStatus } from '@/lib/sessionService';

export default function HostLobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionCode, sessionId, selectedServices } = useSession();
  const { participants } = useParticipants(sessionId);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my FlickPick session! Code: ${sessionCode}`,
      });
    } catch {}
  };

  const handleStartSwiping = async () => {
    if (!sessionId) return;
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

  const getAvatarColor = (seed: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[seed % colors.length];
  };

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
        <View style={styles.codeDisplay}>
          {(sessionCode || 'FILM42').split('').map((char, i) => (
            <View key={i} style={styles.codeChar}>
              <Text style={styles.codeCharText}>{char}</Text>
            </View>
          ))}
        </View>
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
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.avatarSeed) }]}>
                <Text style={styles.avatarText}>{item.nickname[0]}</Text>
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
          style={[
            styles.startButton,
            participants.length < 2 && styles.startButtonDisabled,
          ]}
          onPress={handleStartSwiping}
          disabled={participants.length < 2}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Swiping</Text>
          <Ionicons name="play" size={20} color={Colors.white} />
        </TouchableOpacity>
        {participants.length < 2 && (
          <Text style={styles.waitingText}>Waiting for more people to join...</Text>
        )}
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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(227, 6, 19, 0.08)',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
    backgroundColor: 'rgba(227, 6, 19, 0.1)',
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
