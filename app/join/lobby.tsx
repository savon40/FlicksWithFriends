import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { STREAMING_SERVICES, AVATARS } from '@/lib/constants';
import { useParticipants } from '@/hooks/useParticipants';
import { useSessionStatus } from '@/hooks/useSessionStatus';

export default function JoinerLobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionCode, sessionId, selectedServices } = useSession();
  const { participants } = useParticipants(sessionId);
  const { status } = useSessionStatus(sessionId);

  // Navigate to swipe when host starts the session
  useEffect(() => {
    if (status === 'active') {
      router.replace('/(session)/swipe');
    }
  }, [status]);

  const selectedServiceNames = selectedServices
    .map((id) => STREAMING_SERVICES.find((s) => s.id === id)?.name)
    .filter(Boolean);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Waiting Room</Text>
      </View>

      {/* Code Display */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>SESSION CODE</Text>
        <View style={styles.codeDisplay}>
          {(sessionCode || 'FILM42').split('').map((char, i) => (
            <View key={i} style={styles.codeChar}>
              <Text style={styles.codeCharText}>{char}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Services the host selected */}
      {selectedServiceNames.length > 0 && (
        <View style={styles.infoCard}>
          <Ionicons name="tv-outline" size={18} color={Colors.muted} />
          <Text style={styles.infoText}>{selectedServiceNames.join(', ')}</Text>
        </View>
      )}

      {/* Participants */}
      <View style={styles.participantsSection}>
        <Text style={styles.participantsTitle}>
          In the Room ({participants.length})
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

      {/* Waiting indicator */}
      <View style={[styles.waitingBar, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.pulseIndicator}>
          <View style={styles.pulseDot} />
        </View>
        <Text style={styles.waitingText}>Waiting for the host to start...</Text>
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
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
  },
  codeSection: {
    alignItems: 'center',
    paddingVertical: 20,
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
  },
  codeChar: {
    width: 44,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCharText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.foreground,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '500',
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
  waitingBar: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 8,
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 188, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  waitingText: {
    fontSize: 14,
    color: Colors.mutedLight,
    fontWeight: '500',
  },
});
