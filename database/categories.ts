import { Category } from '@/types/database';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

// Create or Update category
export async function createCategory(category: Category): Promise<Category> {
  const categories = await loadFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
  categories.push(category);
  await saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  return category;
}

export async function updateCategory(category: Category): Promise<Category> {
  const categories = await loadFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
  const index = categories.findIndex((c) => c.id === category.id);
  
  if (index === -1) {
    throw new Error(`Category with id ${category.id} not found`);
  }
  
  categories[index] = category;
  await saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  return category;
}

export async function saveCategory(category: Category): Promise<Category> {
  const categories = await loadFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
  const index = categories.findIndex((c) => c.id === category.id);
  
  if (index >= 0) {
    categories[index] = category;
  } else {
    categories.push(category);
  }
  
  await saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  return category;
}

// Read categories
export async function getAllCategories(): Promise<Category[]> {
  return loadFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
}

export async function getCategory(id: string): Promise<Category | null> {
  const categories = await loadFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
  return categories.find((c) => c.id === id) || null;
}

// Delete category
export async function deleteCategory(id: string): Promise<void> {
  const categories = await loadFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
  const filtered = categories.filter((c) => c.id !== id);
  await saveToStorage(STORAGE_KEYS.CATEGORIES, filtered);
  
  // Update subscriptions to remove category reference
  const subscriptions = await loadFromStorage(STORAGE_KEYS.SUBSCRIPTIONS);
  const updatedSubscriptions = subscriptions.map((s: any) =>
    s.category_id === id ? { ...s, category_id: null } : s
  );
  await saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, updatedSubscriptions);
}
