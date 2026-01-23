// Re-export all CRUD operations from separate files
// Import for internal use
import { cancelNotificationsForSubscription } from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteOccurrenceLogsBySubscription } from './occurrenceLog';
import { getAllSettings } from './settings';
import { STORAGE_KEYS } from './storage';
import {
  createSubscription,
  deleteSubscription as deleteSubscriptionBase,
  getAllSubscriptions,
  getSubscription,
  getSubscriptionsByCategory,
  getSubscriptionsByStatus,
  saveSubscription,
  updateSubscription,
} from './subscriptions';

export * from './categories';
export * from './occurrenceLog';
export * from './reminders';
export * from './settings';
export { generateUUID, getCurrentDateTime, getCurrentDate } from './utils';

// Export subscription functions (except deleteSubscription which we override below)
export {
  createSubscription, getAllSubscriptions,
  getSubscription,
  getSubscriptionsByCategory,
  getSubscriptionsByStatus, saveSubscription, updateSubscription
};

// Re-export storage utilities
  export { STORAGE_KEYS } from './storage';

// Override deleteSubscription to handle cascading deletes
export async function deleteSubscription(id: string): Promise<void> {
  // Cancel scheduled notifications and delete reminder records
  await cancelNotificationsForSubscription(id);
  await deleteOccurrenceLogsBySubscription(id);
  // Then delete the subscription
  await deleteSubscriptionBase(id);
}

// Initialize database (no-op for localStorage, but kept for compatibility)
export async function initDatabase(): Promise<void> {
  // localStorage/AsyncStorage doesn't need initialization
  // This function is kept for compatibility with existing code
  console.log('Database ready (using AsyncStorage)');
  // log the settings data from the database
  const settings = await getAllSettings();
  console.log('Settings:', settings);
}

// Close database (no-op for localStorage, but kept for compatibility)
export async function closeDatabase(): Promise<void> {
  // localStorage/AsyncStorage doesn't need closing
  // This function is kept for compatibility with existing code
  console.log('Database closed (using AsyncStorage)');
}

// Reset/clear all database data (for development purposes)
export async function resetDatabase(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS),
      AsyncStorage.removeItem(STORAGE_KEYS.CATEGORIES),
      AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.removeItem(STORAGE_KEYS.OCCURRENCE_LOG),
      AsyncStorage.removeItem(STORAGE_KEYS.REMINDERS),
    ]);
    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}
