import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { Colors } from '../constants/tokens';
import { ThemeProvider } from '../context/ThemeContext';
import { useSettingsStore } from '../store/settingsStore';

function TabIcon({ label, icon, focused }: { label: string; icon: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function AppShell() {
  const palette = useSettingsStore(s => s.palette);

  return (
    <ThemeProvider palette={palette}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon label="Accueil" icon="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon label="Tâches" icon="☑" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="agenda"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon label="Agenda" icon="📅" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon label="IA" icon="✨" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon label="Réglages" icon="⚙" focused={focused} />,
          }}
        />
        <Tabs.Screen name="project/[id]" options={{ href: null }} />
      </Tabs>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'BricolageGrotesque-Regular':   BricolageGrotesque_400Regular,
    'BricolageGrotesque-SemiBold':  BricolageGrotesque_600SemiBold,
    'BricolageGrotesque-Bold':      BricolageGrotesque_700Bold,
    'BricolageGrotesque-ExtraBold': BricolageGrotesque_800ExtraBold,
    'HankenGrotesk-Regular':        HankenGrotesk_400Regular,
    'HankenGrotesk-Medium':         HankenGrotesk_500Medium,
    'HankenGrotesk-SemiBold':       HankenGrotesk_600SemiBold,
    'HankenGrotesk-Bold':           HankenGrotesk_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.line,
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 0,
  },
  tabItem:        { alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 8 },
  tabIcon:        { fontSize: 22, opacity: 0.45 },
  tabIconActive:  { opacity: 1 },
  tabLabel:       { fontSize: 10, fontWeight: '600', color: Colors.faint },
  tabLabelActive: { color: Colors.accent },
});
