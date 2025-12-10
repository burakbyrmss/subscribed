// Re-export all CRUD operations from separate files
// Import for internal use
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteOccurrenceLogsBySubscription } from './occurrenceLog';
import { deleteRemindersBySubscription } from './reminders';
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
  // Delete related occurrence logs and reminders first
  await deleteOccurrenceLogsBySubscription(id);
  await deleteRemindersBySubscription(id);
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

// Utility function to generate UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Utility function to get current datetime in ISO format
export function getCurrentDateTime(): string {
  return new Date().toISOString();
}

// Utility function to get current date in YYYY-MM-DD format
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}
