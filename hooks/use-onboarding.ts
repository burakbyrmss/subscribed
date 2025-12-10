import { getAllSettings } from '@/database';
import { useEffect, useState } from 'react';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const settings = await getAllSettings();
      const backupHintSetting = settings.find((s) => s.key === 'backup_hint_dismissed');
      const completed = backupHintSetting?.value === 'true';
      setHasCompletedOnboarding(completed);
    };
    checkOnboarding();
  }, []);

  return hasCompletedOnboarding;
}

