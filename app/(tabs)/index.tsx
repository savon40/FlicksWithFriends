import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
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
        colors={['#e0f7fa', '#e0f2f1', '#eceff1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={[styles.content, { paddingTop: insets.top + 40 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>Flicks With Friends</Text>
          <Text style={styles.tagline}>PICK TOGETHER. WATCH TOGETHER.</Text>
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

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Create or Join</Text>
              <Text style={styles.stepDescription}>
                Start a new session and share the code with friends, or join one with a code you've received.
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Swipe on Movies and Shows</Text>
              <Text style={styles.stepDescription}>
                Everyone swipes right on movies and/or shows they'd watch and left on ones they'd skip.
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>See Your Matches</Text>
              <Text style={styles.stepDescription}>
                When everyone's done, see the movies your group all agreed on. No more endless debates!
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>No signup required. Sessions expire in 24h.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://savon40.github.io/FlicksWithFriends/privacy.html')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>|</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://savon40.github.io/FlicksWithFriends/')}>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 188, 212, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 25,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 2,
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
    backgroundColor: 'rgba(0, 188, 212, 0.08)',
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
    backgroundColor: 'rgba(0, 188, 212, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  howItWorksSection: {
    marginTop: 32,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
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
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.mutedLight,
  },
  footerSeparator: {
    fontSize: 12,
    color: Colors.mutedLight,
    marginHorizontal: 8,
  },
});
