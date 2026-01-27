import { getAllSettings, getCurrentDateTime, saveSetting } from '@/database';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { BuyMeCoffee } from './buy-me-coffee';

// Show popup every 7 days after first app use
const POPUP_INTERVAL_DAYS = 7;
const FIRST_TIME_DELAY_MS = 60 * 1000; // 1 minute before first popup

export function BuyMeCoffeePopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const checkAndShowPopup = async () => {
      try {
        const settings = await getAllSettings();
        const lastShownSetting = settings.find((s) => s.key === 'buy_me_coffee_last_shown');
        const dismissedSetting = settings.find((s) => s.key === 'buy_me_coffee_dismissed');

        if (dismissedSetting?.value === 'true') return;

        const now = dayjs();
        let shouldShow = false;

        if (!lastShownSetting) {
          shouldShow = true;
        } else {
          const lastShown = dayjs(lastShownSetting.value);
          const daysSinceLastShown = now.diff(lastShown, 'day');
          shouldShow = daysSinceLastShown >= POPUP_INTERVAL_DAYS;
        }

        if (shouldShow) {
          setShowPopup(true);
          await saveSetting({
            key: 'buy_me_coffee_last_shown',
            value: now.toISOString(),
            updated_at: getCurrentDateTime(),
          });
        }
      } catch (error) {
        console.error('Error checking buy me coffee popup:', error);
      }
    };

    let cancelled = false;
    const schedule = async () => {
      try {
        const settings = await getAllSettings();
        if (cancelled) return;
        const lastShownSetting = settings.find((s) => s.key === 'buy_me_coffee_last_shown');
        const dismissedSetting = settings.find((s) => s.key === 'buy_me_coffee_dismissed');
        if (dismissedSetting?.value === 'true') return;
        const isFirstTime = !lastShownSetting;
        const delayMs = isFirstTime ? FIRST_TIME_DELAY_MS : 2000;
        timerId = setTimeout(checkAndShowPopup, delayMs);
      } catch {
        if (!cancelled) timerId = setTimeout(checkAndShowPopup, FIRST_TIME_DELAY_MS);
      }
    };

    schedule();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const handleClose = async () => {
    setShowPopup(false);
  };

  const handleDismiss = async () => {
    try {
      await saveSetting({
        key: 'buy_me_coffee_dismissed',
        value: 'true',
        updated_at: getCurrentDateTime(),
      });
      setShowPopup(false);
    } catch (error) {
      console.error('Error dismissing buy me coffee:', error);
      setShowPopup(false);
    }
  };

  if (!showPopup) return null;

  return (
    <BuyMeCoffee
      visible={showPopup}
      onClose={handleClose}
      onDismiss={handleDismiss}
    />
  );
}
