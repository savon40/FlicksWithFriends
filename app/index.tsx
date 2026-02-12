import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { getDeviceId } from '@/lib/device';
import { lookupSessionByCode, addParticipant } from '@/lib/sessionService';

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleStartSession = () => {
    session.setIsHost(true);
    router.push('/create/services');
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    const char = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    newCode[index] = char;
    setCode(newCode);

    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const [joining, setJoining] = useState(false);

  const handleJoinSession = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH || joining) return;
    setJoining(true);
    try {
      const found = await lookupSessionByCode(fullCode);
      if (!found) {
        Alert.alert('Not Found', 'No active session with that code.');
        return;
      }
      const deviceId = await getDeviceId();
      const participant = await addParticipant({
        sessionId: found.id,
        deviceId,
        nickname: 'Guest',
        isHost: false,
      });
      session.setSessionCode(found.code);
      session.setSessionId(found.id);
      session.setParticipantId(participant.id);
      session.setMatchThreshold(found.matchThreshold);
      session.setSelectedServices(found.streamingServices);
      session.setIsHost(false);
      router.push('/join/lobby');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not join session');
    } finally {
      setJoining(false);
    }
  };

  const isCodeComplete = code.every((c) => c !== '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={['#e8d5d0', '#c9d4e0', '#d5d5d5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>FlickPick</Text>
          <Text style={styles.tagline}>SWIPE. MATCH. WATCH.</Text>
        </View>

        {/* Cards Section */}
        <View style={styles.cardsSection}>
          {/* Start New Session Card */}
          <TouchableOpacity
            style={styles.startCard}
            onPress={handleStartSession}
            activeOpacity={0.7}
          >
            <View style={styles.startCardContent}>
              <View style={styles.startIconContainer}>
                <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.startCardTextContainer}>
                <Text style={styles.startCardTitle}>Start New Session</Text>
                <Text style={styles.startCardSubtitle}>Create a room and invite friends</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.muted} />
            </View>
          </TouchableOpacity>

          {/* Join Session Card */}
          <View style={styles.joinCard}>
            <View style={styles.joinHeader}>
              <Ionicons name="people-outline" size={22} color={Colors.foreground} />
              <Text style={styles.joinTitle}>Join Session</Text>
            </View>

            {/* Code Input */}
            <View style={styles.codeInputContainer}>
              {Array(CODE_LENGTH)
                .fill(0)
                .map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeBox,
                      code[i] ? styles.codeBoxFilled : null,
                      i === code.findIndex((c) => c === '') ? styles.codeBoxActive : null,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => (inputRefs.current[i] = ref)}
                      style={styles.codeInput}
                      value={code[i]}
                      onChangeText={(text) => handleCodeChange(text, i)}
                      onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, i)}
                      maxLength={1}
                      autoCapitalize="characters"
                      keyboardType="default"
                      selectTextOnFocus
                    />
                    {!code[i] && i === code.findIndex((c) => c === '') && (
                      <View style={styles.cursor} />
                    )}
                  </View>
                ))}
            </View>

            {/* Enter Room Button */}
            <TouchableOpacity
              style={[styles.enterButton, (!isCodeComplete || joining) && styles.enterButtonDisabled]}
              onPress={handleJoinSession}
              disabled={!isCodeComplete || joining}
              activeOpacity={0.8}
            >
              {joining ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.enterButtonText}>Enter Room</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>No signup required. Sessions expire in 24h.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
    textShadowColor: 'rgba(227, 6, 19, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 25,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 4,
    marginTop: 4,
  },
  cardsSection: {
    gap: 16,
  },
  startCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  startCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(227, 6, 19, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  startCardTextContainer: {
    flex: 1,
  },
  startCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  startCardSubtitle: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 2,
  },
  joinCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  joinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  joinTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  codeBox: {
    width: (width - 48 - 40 - 40) / CODE_LENGTH,
    aspectRatio: 0.75,
    maxWidth: 52,
    maxHeight: 68,
    backgroundColor: Colors.mutedBackground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  codeBoxFilled: {
    borderColor: Colors.mutedLight,
    backgroundColor: Colors.white,
  },
  codeBoxActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.foreground,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  cursor: {
    position: 'absolute',
    bottom: 14,
    width: 20,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  enterButton: {
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
  enterButtonDisabled: {
    opacity: 0.5,
  },
  enterButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
    paddingTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: Colors.mutedLight,
  },
});
