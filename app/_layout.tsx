import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';

import { BuyMeCoffeePopup } from '@/components/buy-me-coffee-popup';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { initDatabase, getAllSettings } from '@/database';
import '@/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);

  useEffect(() => {
    // Initialize database and check onboarding status
    const initialize = async () => {
      try {
        await initDatabase();
        const settings = await getAllSettings();
        const onboardingSetting = settings.find((s) => s.key === 'onboarding_completed');
        const hasCompletedOnboarding = onboardingSetting?.value === 'true';
        
        setIsOnboardingChecked(true);
        
        // If onboarding not completed and not already on onboarding screen, redirect
        if (!hasCompletedOnboarding && segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsOnboardingChecked(true);
      }
    };
    initialize();
  }, [router, segments]);

  useEffect(() => {
    // Handle notification taps when app is already open or in background
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.subscriptionId) {
        router.push(`/subscription/${data.subscriptionId}`);
      }
    });

    // Handle notification tap when app is opened from closed state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.subscriptionId) {
          // Use setTimeout to ensure router is ready
          setTimeout(() => {
            router.push(`/subscription/${data.subscriptionId}`);
          }, 100);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Don't render until onboarding check is complete
  if (!isOnboardingChecked) {
    return null;
  }

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false } as any} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subscription/[id]" options={{ headerShown: false } as any} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('common.modal') } as any} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <BuyMeCoffeePopup />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider defaultTheme="dark">
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
