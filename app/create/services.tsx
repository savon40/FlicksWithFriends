import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useSession } from '@/lib/SessionContext';
import { STREAMING_SERVICES } from '@/lib/constants';

export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedServices, toggleService } = useSession();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
          <Text style={styles.headerTitle}>Streaming Services</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Select the services your group has access to
      </Text>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      {/* Services Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {STREAMING_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          return (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                isSelected && styles.serviceCardSelected,
                isSelected && { borderColor: service.color },
              ]}
              onPress={() => toggleService(service.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.serviceLogo,
                  { backgroundColor: isSelected ? service.color : Colors.mutedBackground },
                ]}
              >
                <Text
                  style={[
                    styles.serviceLogoText,
                    { color: isSelected ? Colors.white : Colors.muted },
                  ]}
                >
                  {service.logo}
                </Text>
              </View>
              <Text
                style={[
                  styles.serviceName,
                  isSelected && styles.serviceNameSelected,
                ]}
                numberOfLines={1}
              >
                {service.name}
              </Text>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: service.color }]}>
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedServices.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={() => router.push('/create/filters')}
          disabled={selectedServices.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            Continue ({selectedServices.length} selected)
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  serviceCard: {
    width: '30%',
    flexGrow: 1,
    maxWidth: '31%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLogoText: {
    fontSize: 18,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    textAlign: 'center',
  },
  serviceNameSelected: {
    color: Colors.foreground,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
