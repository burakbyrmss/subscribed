import { Setting } from '@/types/database';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

// Create or Update setting
export async function createSetting(setting: Setting): Promise<Setting> {
  const settings = await loadFromStorage<Setting>(STORAGE_KEYS.SETTINGS);
  settings.push(setting);
  await saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  return setting;
}

export async function updateSetting(setting: Setting): Promise<Setting> {
  const settings = await loadFromStorage<Setting>(STORAGE_KEYS.SETTINGS);
  const index = settings.findIndex((s) => s.key === setting.key);
  
  if (index === -1) {
    throw new Error(`Setting with key ${setting.key} not found`);
  }
  
  settings[index] = setting;
  await saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  return setting;
}

export async function saveSetting(setting: Setting): Promise<Setting> {
  const settings = await loadFromStorage<Setting>(STORAGE_KEYS.SETTINGS);
  const index = settings.findIndex((s) => s.key === setting.key);
  
  if (index >= 0) {
    settings[index] = setting;
  } else {
    settings.push(setting);
  }
  
  await saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  return setting;
}

// Read settings
export async function getAllSettings(): Promise<Setting[]> {
  return loadFromStorage<Setting>(STORAGE_KEYS.SETTINGS);
}

export async function getSetting(key: string): Promise<Setting | null> {
  const settings = await loadFromStorage<Setting>(STORAGE_KEYS.SETTINGS);
  return settings.find((s) => s.key === key) || null;
}

// Delete setting
export async function deleteSetting(key: string): Promise<void> {
  const settings = await loadFromStorage<Setting>(STORAGE_KEYS.SETTINGS);
  const filtered = settings.filter((s) => s.key !== key);
  await saveToStorage(STORAGE_KEYS.SETTINGS, filtered);
}
