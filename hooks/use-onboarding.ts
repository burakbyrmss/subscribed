import { getAllSettings } from '@/database';
import { useEffect, useState } from 'react';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const settings = await getAllSettings();
      const onboardingSetting = settings.find((s) => s.key === 'onboarding_completed');
      const completed = onboardingSetting?.value === 'true';
      setHasCompletedOnboarding(completed);
    };
    checkOnboarding();
  }, []);

  return hasCompletedOnboarding;
}

