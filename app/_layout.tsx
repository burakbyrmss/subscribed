import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { BuyMeCoffeePopup } from '@/components/buy-me-coffee-popup';
import { getAllSettings, initDatabase } from '@/database';
import { getOsTheme, useTheme } from '@/hooks/use-theme';
import '@/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
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
        const themeSetting = settings.find((s) => s.key === 'theme');
        if (!themeSetting) {
          setTheme(getOsTheme());
        }
        
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
  console.log('theme', theme);
  // Don't render until onboarding check is complete
  if (!isOnboardingChecked) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} className={theme === 'dark' ? 'dark' : 'light'}>
      {/* <NavigationThemeProvider value={DefaultTheme}> */}
        <Stack>
          <Stack.Screen name="onboarding" options={{ headerShown: false } as any} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="subscription/[id]" options={{ headerShown: false } as any} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('common.modal') } as any} />
        </Stack>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <BuyMeCoffeePopup />
      {/* </NavigationThemeProvider> */}
    </View>
  );
}


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
