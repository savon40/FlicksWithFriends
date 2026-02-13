import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSession();

  const handleStartSession = () => {
    session.setIsHost(true);
    router.push('/create/profile');
  };

  const handleJoinSession = () => {
    router.push('/join/enter-code');
  };

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
          <TouchableOpacity
            style={styles.joinCard}
            onPress={handleJoinSession}
            activeOpacity={0.7}
          >
            <View style={styles.startCardContent}>
              <View style={styles.joinIconContainer}>
                <Ionicons name="people-outline" size={28} color={Colors.primary} />
              </View>
              <View style={styles.startCardTextContainer}>
                <Text style={styles.startCardTitle}>Join Session</Text>
                <Text style={styles.startCardSubtitle}>Enter a code to join your group</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.muted} />
            </View>
          </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  joinIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(227, 6, 19, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
