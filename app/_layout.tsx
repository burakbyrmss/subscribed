import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import '../global.css';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { initDatabase } from '@/database';
import { store } from '@/store';

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
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="light">
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}
