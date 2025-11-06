import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

export function useOnboarding() {
  const settings = useAppSelector((state) => state.settings.settings);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if onboarding has been completed
    // For now, we'll check a setting. In a real app, you might want to check AsyncStorage
    const completed = settings.backup_hint_dismissed === 'true'; // Temporary check
    setHasCompletedOnboarding(completed);
  }, [settings]);

  return hasCompletedOnboarding;
}

