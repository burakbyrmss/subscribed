import { Subscription } from '@/types/database';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

// Create or Update subscription
export async function createSubscription(subscription: Subscription): Promise<Subscription> {
  const subscriptions = await loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  subscriptions.push(subscription);
  await saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  return subscription;
}

export async function updateSubscription(subscription: Subscription): Promise<Subscription> {
  const subscriptions = await loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  const index = subscriptions.findIndex((s) => s.id === subscription.id);
  
  if (index === -1) {
    throw new Error(`Subscription with id ${subscription.id} not found`);
  }
  
  subscriptions[index] = subscription;
  await saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  return subscription;
}

export async function saveSubscription(subscription: Subscription): Promise<Subscription> {
  const subscriptions = await loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  const index = subscriptions.findIndex((s) => s.id === subscription.id);
  
  if (index >= 0) {
    subscriptions[index] = subscription;
  } else {
    subscriptions.push(subscription);
  }
  
  await saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  return subscription;
}

// Read subscriptions
export async function getAllSubscriptions(): Promise<Subscription[]> {
  return loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const subscriptions = await loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  return subscriptions.find((s) => s.id === id) || null;
}

export async function getSubscriptionsByCategory(categoryId: string): Promise<Subscription[]> {
  const subscriptions = await loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  return subscriptions.filter((s) => s.category_id === categoryId);
}

export async function getSubscriptionsByStatus(status: Subscription['status']): Promise<Subscription[]> {
  const subscriptions = await loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  return subscriptions.filter((s) => s.status === status);
}

// Delete subscription
export async function deleteSubscription(id: string): Promise<void> {
  const subscriptions = await loadFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  const filtered = subscriptions.filter((s) => s.id !== id);
  await saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, filtered);
}
