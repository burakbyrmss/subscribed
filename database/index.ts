import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { getAllSchemas } from './schema';

let db: SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLiteDatabase> {
  if (db) {
    return db;
  }

  try {
    // Open database connection
    db = await openDatabaseAsync('subscribed.db');

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create all tables and indexes
    const schemas = getAllSchemas();
    for (const schema of schemas) {
      await db.execAsync(schema);
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export function getDatabase(): SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
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

