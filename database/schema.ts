// SQL Schema Definitions

export const createSubscriptionsTable = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT,
    price_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    interval INTEGER NOT NULL DEFAULT 1,
    anchor_date TEXT NOT NULL,
    by_month_day INTEGER,
    remind_days_before INTEGER NOT NULL DEFAULT 2,
    remind_time TEXT NOT NULL DEFAULT '09:00',
    category_id TEXT,
    tags TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
`;

export const createCategoriesTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const createOccurrenceLogTable = `
  CREATE TABLE IF NOT EXISTS occurrence_log (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('due', 'paid', 'skipped')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
  );
`;

export const createSettingsTable = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const createRemindersTable = `
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    fire_datetime TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'fired', 'canceled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
  );
`;

// Indexes
export const createSubscriptionsNameIndex = `
  CREATE INDEX IF NOT EXISTS idx_subscriptions_name ON subscriptions(name);
`;

export const createSubscriptionsStatusIndex = `
  CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
`;

export const createSubscriptionsCategoryIndex = `
  CREATE INDEX IF NOT EXISTS idx_subscriptions_category_id ON subscriptions(category_id);
`;

export const createOccurrenceLogSubscriptionIndex = `
  CREATE INDEX IF NOT EXISTS idx_occurrence_log_subscription_id ON occurrence_log(subscription_id);
`;

export const createOccurrenceLogDateIndex = `
  CREATE INDEX IF NOT EXISTS idx_occurrence_log_date ON occurrence_log(date);
`;

export const createRemindersSubscriptionIndex = `
  CREATE INDEX IF NOT EXISTS idx_reminders_subscription_id ON reminders(subscription_id);
`;

export const createRemindersFireDatetimeIndex = `
  CREATE INDEX IF NOT EXISTS idx_reminders_fire_datetime ON reminders(fire_datetime);
`;

export const createRemindersStatusIndex = `
  CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
`;

// Compound index for next occurrences query (if we add next_due_date column later)
// CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date ON subscriptions(status, next_due_date) WHERE status = 'active';

export const getAllSchemas = (): string[] => {
  return [
    createCategoriesTable, // Create categories first (subscriptions references it)
    createSubscriptionsTable,
    createOccurrenceLogTable,
    createSettingsTable,
    createRemindersTable,
    // Indexes
    createSubscriptionsNameIndex,
    createSubscriptionsStatusIndex,
    createSubscriptionsCategoryIndex,
    createOccurrenceLogSubscriptionIndex,
    createOccurrenceLogDateIndex,
    createRemindersSubscriptionIndex,
    createRemindersFireDatetimeIndex,
    createRemindersStatusIndex,
  ];
};

