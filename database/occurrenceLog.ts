import { OccurrenceLog } from '@/types/database';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

// Create or Update occurrence log
export async function createOccurrenceLog(occurrenceLog: OccurrenceLog): Promise<OccurrenceLog> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  logs.push(occurrenceLog);
  await saveToStorage(STORAGE_KEYS.OCCURRENCE_LOG, logs);
  return occurrenceLog;
}

export async function updateOccurrenceLog(occurrenceLog: OccurrenceLog): Promise<OccurrenceLog> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  const index = logs.findIndex((log) => log.id === occurrenceLog.id);
  
  if (index === -1) {
    throw new Error(`OccurrenceLog with id ${occurrenceLog.id} not found`);
  }
  
  logs[index] = occurrenceLog;
  await saveToStorage(STORAGE_KEYS.OCCURRENCE_LOG, logs);
  return occurrenceLog;
}

export async function saveOccurrenceLog(occurrenceLog: OccurrenceLog): Promise<OccurrenceLog> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  const index = logs.findIndex((log) => log.id === occurrenceLog.id);
  
  if (index >= 0) {
    logs[index] = occurrenceLog;
  } else {
    logs.push(occurrenceLog);
  }
  
  await saveToStorage(STORAGE_KEYS.OCCURRENCE_LOG, logs);
  return occurrenceLog;
}

// Read occurrence logs
export async function getAllOccurrenceLogs(): Promise<OccurrenceLog[]> {
  return loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
}

export async function getOccurrenceLog(id: string): Promise<OccurrenceLog | null> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  return logs.find((log) => log.id === id) || null;
}

export async function getOccurrenceLogsBySubscription(subscriptionId: string): Promise<OccurrenceLog[]> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  return logs.filter((log) => log.subscription_id === subscriptionId);
}

export async function getOccurrenceLogsByDate(date: string): Promise<OccurrenceLog[]> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  return logs.filter((log) => log.date === date);
}

export async function getOccurrenceLogsByStatus(status: OccurrenceLog['status']): Promise<OccurrenceLog[]> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  return logs.filter((log) => log.status === status);
}

// Delete occurrence log
export async function deleteOccurrenceLog(id: string): Promise<void> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  const filtered = logs.filter((log) => log.id !== id);
  await saveToStorage(STORAGE_KEYS.OCCURRENCE_LOG, filtered);
}

export async function deleteOccurrenceLogsBySubscription(subscriptionId: string): Promise<void> {
  const logs = await loadFromStorage<OccurrenceLog>(STORAGE_KEYS.OCCURRENCE_LOG);
  const filtered = logs.filter((log) => log.subscription_id !== subscriptionId);
  await saveToStorage(STORAGE_KEYS.OCCURRENCE_LOG, filtered);
}
