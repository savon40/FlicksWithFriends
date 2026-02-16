import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { AVATARS } from '@/lib/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { nickname, setNickname, avatarSeed, setAvatarSeed } = useSession();

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
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <Text style={styles.headerTitle}>Your Profile</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Set your nickname and pick an avatar
      </Text>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '33%' }]} />
      </View>

      <View style={styles.content}>
        {/* Nickname Input */}
        <View style={styles.nicknameSection}>
          <Text style={styles.sectionTitle}>Nickname</Text>
          <TextInput
            style={styles.nicknameInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="What should we call you?"
            placeholderTextColor={Colors.mutedLight}
            maxLength={20}
            autoFocus
          />
        </View>

        {/* Avatar Grid */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>Choose an Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((avatar) => {
              const isSelected = avatarSeed === avatar.id;
              return (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    isSelected && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setAvatarSeed(avatar.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !nickname.trim() && styles.continueButtonDisabled,
          ]}
          onPress={() => router.push('/create/services')}
          disabled={!nickname.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
  subtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  nicknameSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
  },
  nicknameInput: {
    height: 52,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.foreground,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  avatarSection: {
    flex: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 188, 212, 0.08)',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  continueButton: {
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
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
