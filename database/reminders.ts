import { Reminder } from '@/types/database';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

// Create or Update reminder
export async function createReminder(reminder: Reminder): Promise<Reminder> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  reminders.push(reminder);
  await saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
  return reminder;
}

export async function updateReminder(reminder: Reminder): Promise<Reminder> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const index = reminders.findIndex((r) => r.id === reminder.id);
  
  if (index === -1) {
    throw new Error(`Reminder with id ${reminder.id} not found`);
  }
  
  reminders[index] = reminder;
  await saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
  return reminder;
}

export async function saveReminder(reminder: Reminder): Promise<Reminder> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const index = reminders.findIndex((r) => r.id === reminder.id);
  
  if (index >= 0) {
    reminders[index] = reminder;
  } else {
    reminders.push(reminder);
  }
  
  await saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
  return reminder;
}

// Read reminders
export async function getAllReminders(): Promise<Reminder[]> {
  return loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
}

export async function getReminder(id: string): Promise<Reminder | null> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  return reminders.find((r) => r.id === id) || null;
}

export async function getRemindersBySubscription(subscriptionId: string): Promise<Reminder[]> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  return reminders.filter((r) => r.subscription_id === subscriptionId);
}

export async function getRemindersByStatus(status: Reminder['status']): Promise<Reminder[]> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  return reminders.filter((r) => r.status === status);
}

export async function getUpcomingReminders(beforeDate?: string): Promise<Reminder[]> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const now = beforeDate || new Date().toISOString();
  return reminders.filter(
    (r) => r.status === 'scheduled' && r.fire_datetime <= now
  );
}

// Delete reminder
export async function deleteReminder(id: string): Promise<void> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const filtered = reminders.filter((r) => r.id !== id);
  await saveToStorage(STORAGE_KEYS.REMINDERS, filtered);
}

export async function deleteRemindersBySubscription(subscriptionId: string): Promise<void> {
  const reminders = await loadFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const filtered = reminders.filter((r) => r.subscription_id !== subscriptionId);
  await saveToStorage(STORAGE_KEYS.REMINDERS, filtered);
}
