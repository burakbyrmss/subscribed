import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  SUBSCRIPTIONS: 'subscriptions',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  OCCURRENCE_LOG: 'occurrence_log',
  REMINDERS: 'reminders',
} as const;

// Generic storage operations
export async function loadFromStorage<T>(key: string): Promise<T[]> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return [];
  }
}

export async function saveToStorage<T>(key: string, data: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    throw error;
  }
}
