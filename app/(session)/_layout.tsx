import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export default function SessionTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="swipe"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name="layers" size={24} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name="flame" size={24} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name="people-outline" size={24} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
});
