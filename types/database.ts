// Database Types
export type SubscriptionFrequency = 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused' | 'canceled';
export type OccurrenceStatus = 'due' | 'paid' | 'skipped';
export type ReminderStatus = 'scheduled' | 'fired' | 'canceled';

export interface Subscription {
  id: string; // UUID
  name: string;
  notes: string | null;
  price_minor: number; // Amount in minor units (cents/kurus)
  currency: string; // ISO 4217 (3 chars)
  frequency: SubscriptionFrequency;
  interval: number; // Default 1
  anchor_date: string; // ISO date string (YYYY-MM-DD)
  by_month_day: number | null; // For month-based rules (1-31)
  remind_days_before: number; // Default 2
  remind_time: string; // HH:mm format, default "09:00"
  category_id: string | null; // FK to categories.id
  tags: string | null; // Comma-separated or could be JSON
  status: SubscriptionStatus; // Default 'active'
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface Category {
  id: string; // UUID
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface OccurrenceLog {
  id: string; // UUID
  subscription_id: string; // FK to subscriptions.id
  date: string; // ISO date string (YYYY-MM-DD)
  status: OccurrenceStatus; // due | paid | skipped
  note: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface Setting {
  key: string;
  value: string; // JSON stringified value
  updated_at: string; // ISO datetime
}

export interface Reminder {
  id: string; // UUID
  subscription_id: string; // FK to subscriptions.id
  fire_datetime: string; // ISO datetime
  status: ReminderStatus; // scheduled | fired | canceled
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

// Settings keys
export type SettingKey =
  | 'currency_default'
  | 'first_day_of_week'
  | 'locale'
  | 'theme'
  | 'backup_hint_dismissed';

