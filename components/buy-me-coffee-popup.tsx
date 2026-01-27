import { getAllSettings, getCurrentDateTime, saveSetting } from '@/database';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { BuyMeCoffee } from './buy-me-coffee';

// Show popup every 7 days after first app use
const POPUP_INTERVAL_DAYS = 7;

export function BuyMeCoffeePopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const checkAndShowPopup = async () => {
      try {
        const settings = await getAllSettings();
        const lastShownSetting = settings.find((s) => s.key === 'buy_me_coffee_last_shown');
        const dismissedSetting = settings.find((s) => s.key === 'buy_me_coffee_dismissed');
        
        // Don't show if permanently dismissed
        if (dismissedSetting?.value === 'true') {
          return;
        }

        const now = dayjs();
        let shouldShow = false;

        if (!lastShownSetting) {
          // First time - show immediately (you can change this to delay)
          // For testing, showing immediately. Change to false and add delay logic if needed
          shouldShow = true;
        } else {
          // Check if 7 days have passed since last shown
          const lastShown = dayjs(lastShownSetting.value);
          const daysSinceLastShown = now.diff(lastShown, 'day');
          shouldShow = daysSinceLastShown >= POPUP_INTERVAL_DAYS;
        }

        if (shouldShow) {
          setShowPopup(true);
          // Update last shown time
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

    // Check after a short delay to ensure app is loaded
    const timer = setTimeout(checkAndShowPopup, 2000);
    return () => clearTimeout(timer);
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
