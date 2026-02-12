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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { getDeviceId } from '@/lib/device';
import { lookupSessionByCode, addParticipant } from '@/lib/sessionService';

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6;

export default function EnterCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [nickname, setNickname] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

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

  const handleJoin = async () => {
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
      const displayName = nickname || 'Guest';
      const participant = await addParticipant({
        sessionId: found.id,
        deviceId,
        nickname: displayName,
        isHost: false,
      });
      session.setSessionCode(found.code);
      session.setSessionId(found.id);
      session.setParticipantId(participant.id);
      session.setMatchThreshold(found.matchThreshold);
      session.setSelectedServices(found.streamingServices);
      session.setIsHost(false);
      session.setNickname(displayName);
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
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Enter the 6-character code shared by the host</Text>

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
                  selectTextOnFocus
                />
              </View>
            ))}
        </View>

        {/* Nickname */}
        <View style={styles.nicknameSection}>
          <Text style={styles.nicknameLabel}>Nickname (optional)</Text>
          <TextInput
            style={styles.nicknameInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Enter a nickname"
            placeholderTextColor={Colors.mutedLight}
            maxLength={20}
          />
        </View>
      </View>

      {/* Join Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.joinButton, (!isCodeComplete || joining) && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={!isCodeComplete || joining}
          activeOpacity={0.8}
        >
          {joining ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.joinButtonText}>Join Session</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  instruction: {
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  codeBox: {
    width: (width - 48 - 40) / CODE_LENGTH,
    maxWidth: 52,
    aspectRatio: 0.75,
    maxHeight: 68,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderColor: Colors.mutedLight,
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
  nicknameSection: {
    marginBottom: 24,
  },
  nicknameLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 8,
  },
  nicknameInput: {
    height: 48,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  joinButton: {
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
  joinButtonDisabled: {
    opacity: 0.4,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
