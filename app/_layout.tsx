import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { initDatabase } from '@/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { theme } = useTheme();

  useEffect(() => {
    // Initialize database on app start
    initDatabase().catch((error) => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false } as any} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subscription/[id]" options={{ headerShown: false } as any} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' } as any} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AppContent />
    </ThemeProvider>
  );
}
