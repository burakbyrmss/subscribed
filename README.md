# Offline Subscriptions Tracker — Analysis & Technical Design

_Last updated: Nov 5, 2025_

## 1) Project Summary
An offline‑first React Native app that lets users record and track recurring subscriptions (weekly, monthly, yearly/annual), get reminders before charges, and view totals/analytics — all without requiring sign‑in or internet. Optional export/import enables backup or device migration.

**Primary goals**
- Fast, private, offline usage
- Simple add/edit flow for a subscription
- Accurate recurrence logic with edge cases (e.g., Feb 29; 31st on short months)
- Local notifications as reminders
- Clear overview of upcoming charges and monthly totals

**Secondary goals**
- Categories/tags and search
- Multi‑currency with fx snapshot per item
- Basic analytics (spend per month/category, active vs. canceled)
- Export/Import backups (JSON)

---

## 2) Personas & Use Cases
**Persona A — Individual budgeter**
- Saves Spotify/Netflix/etc., wants a reminder 2 days before renewal.

**Persona B — Freelancer/SMB**
- Tracks SaaS, domain renewals, Apple/Google subscriptions; needs monthly totals for taxes.

**Core use cases**
1. Add a subscription with name, price, currency, billing cadence, first charge date, payment method, and reminder time.
2. See a list of upcoming charges (next 30 days) and monthly totals.
3. Snooze or dismiss reminders; mark as canceled.
4. Quick filter/search by name/category/tag.
5. Export data to a file and import it on new device.

---

## 3) Feature Scope
### 3.1 MVP
- Create/Update/Delete subscriptions
- Recurrence types: **weekly, monthly, yearly** (interval = 1; MVP)
- Reminder: **N days before** renewal + time of day
- Upcoming list (next 30/60 days), monthly totals
- Local only (no account)
- Export/Import JSON
- Basic categories (optional) & search

### 3.2 Post‑MVP
- Intervals (e.g., every 2 weeks/months)
- Additional frequencies (daily, bi‑weekly, quarterly)
- Attachments (invoice screenshot)
- Widgets (Android/iOS)
- iCloud/Google Drive auto‑backup (opt‑in)
- Analytics (top categories, heatmap)

---

## 4) Non‑Functional Requirements
- **Offline‑first**: app must work without network permissions
- **Performance**: open under 1s; list virtualization for 1k+ items
- **Stability**: date/recurrence logic must be deterministically tested
- **Privacy**: no third‑party trackers by default
- **Accessibility**: dynamic font sizes, VoiceOver support, contrast

---

## 5) Architecture Overview
### 5.1 Stack (recommended)
- **RN runtime**: React Native (Expo).
- **Local DB**: SQLite via `expo-sqlite` (portable), wrapped with a small data layer.
- **State**: UI state with **Redux Toolkit**.
- **Dates/recurrence**: `dayjs`.
- **Validation**: `zod` for runtime schema (forms, import).
- **Notifications**: `expo-notifications` for local scheduled notifications.
- **File ops**: `expo-file-system`, `expo-document-picker`, `expo-sharing` for export/import.
- **Theming**: **nativewind**

### 5.2 Module boundaries
- `core/recurrence` — compute next occurrences, handle edge cases
- `core/currency` — minor units math; currency formatting
- `data/sqlite` — migrations, DAOs, queries
- `features/subscriptions` — CRUD, list, details, reminders
- `features/analytics` — aggregations by period/category
- `features/backup` — export/import validators and mappers

---

## 6) Data Model
> Store amounts in **minor units** (e.g., cents/kurus) as integers to avoid float issues.

### Tables
**subscriptions**
- `id` (string, uuid)
- `name` (text, required)
- `notes` (text, nullable)
- `price_minor` (integer, required)
- `currency` (char[3], ISO 4217, default device locale)
- `frequency` (enum: `weekly` | `monthly` | `yearly`)
- `interval` (int, default 1) — post‑MVP
- `anchor_date` (date) — first billing date; drives schedule
- `by_month_day` (int, nullable) — for month‑based rules (e.g., 31)
- `remind_days_before` (int, default 2)
- `remind_time` (string `HH:mm`, default device 09:00)
- `category_id` (fk categories.id, nullable)
- `tags` (text, nullable; comma‑sep or link table)
- `status` (enum: `active` | `paused` | `canceled`, default active)
- `created_at` (datetime)
- `updated_at` (datetime)

**categories**
- `id`, `name`, `icon`, `color`

**occurrence_log** (optional, Post‑MVP)
- For marking an occurrence as paid/skipped
- `id`, `subscription_id`, `date`, `status` (`due`|`paid`|`skipped`), `note`

**settings** (kv)
- `currency_default`, `first_day_of_week`, `locale`, `theme`, `backup_hint_dismissed`

**reminders** (derived/scheduled)
- `id`, `subscription_id`, `fire_datetime`, `status` (`scheduled`|`fired`|`canceled`)

### Indices
- `subscriptions(name)`, `subscriptions(status)`, `subscriptions(category_id)`
- Compound index for next occurrences query if we persist `next_due_date` (denormalized column; recompute on update)

---

## 7) Recurrence & Edge Cases
**Monthly rule**
- Default: repeat on the **same day-of-month** as `anchor_date`.
- If the target month has fewer days (e.g., 31 → Feb), policy: **"use last day of month"**.
- Store `by_month_day = anchor_date.day()` to keep intent stable when user edits anchor.

**Weekly rule**
- Repeat on the same weekday as `anchor_date` with `interval` weeks (MVP: 1).

**Yearly rule**
- Repeat on the same month/day; handle Feb 29 → policy: **Mar 1** (or user‑selectable fallback post‑MVP).

**Next occurrence algorithm (sketch)**
1. Start from `today` (local timezone) or custom horizon start.
2. Generate next N occurrences or next within [start, end].
3. Apply policy transforms for short months/leap years.
4. Persist/return the **next due date** for each subscription.

All paths covered by unit tests with fixed tz snapshots.

---

## 8) Reminders (Local Notifications)
- On create/update, schedule a local notification at `due_date - remind_days_before` at `remind_time`.
- If the computed time is in the past (e.g., user created today and remind_days_before = 2), schedule the **next** cycle only.
- Respect OS limitations on repeating notifications (iOS has limited repeat granularity) — we schedule discrete notifications for the next N periods (e.g., next 6 months) and refresh in a background task.
- Tap action → deep‑link to subscription detail.
- Snooze actions (post‑MVP): 1 day / 3 days / custom.

---

## 9) Screens & Navigation
1. **Home / Upcoming**
   - Segments: Upcoming (30d) · All · Canceled
   - Search + filters (category/tag)
   - Cards show name, next due, price, frequency, reminder chip
2. **Add / Edit Subscription**
   - Fields per data model; live preview of next 3 occurrences
   - Validation messages via Zod
3. **Analytics** (MVP‑light)
   - Current month total; per‑category breakdown (pie/bars)
4. **Settings**
   - Currency default, first day of week, theme, export/import
5. **Onboarding**
   - 2–3 slides explaining privacy, offline, and reminders permissions

**Navigation**: Bottom tabs (Home · Add · Analytics · Settings) or FAB for add.

---

## 10) UX Details & Design System
- Adaptive themes: light/dark; follow system
- Number input with currency suffix; uses locale formatting but stores minor units
- Date pickers: use platform pickers; show policy text for short months
- Empty states with quick add examples
- Snackbar confirmations for CRUD; undo delete

---

## 11) Currency & Formatting
- Store `price_minor` (e.g., 19.99 USD → 1999)
- `currency` is ISO 4217 (`TRY`, `USD`, `EUR`)
- Formatting via Intl APIs (`Intl.NumberFormat`) or `react-intl`
- (Optional) Store a `fx_rate` snapshot if user enters a secondary display currency; never fetch automatically in MVP (offline)

---

## 12) Backup & Import
**Export**
- JSON with version header, schema, and arrays of tables
- Offer share/save via Files app / Android sharesheet

**Import**
- Pick a JSON; validate with Zod; offer **merge** or **replace**
- On merge, upsert by `id`; on replace, wipe and import
- Show summary: added/updated/skipped

---

## 13) Security & Privacy
- No network by default (no analytics). Optional crash reports (Sentry) as explicit opt‑in.
- At‑rest protection (optional post‑MVP): encrypt DB file or sensitive fields (names are not sensitive; amounts might be). On iOS, prefer NSFileProtectionComplete; on Android, rely on app sandbox.
- FaceID/Passcode lock (post‑MVP).

---

## 14) Testing Strategy
- **Unit**: recurrence, short‑month policy, next‑occurrence generation, currency math
- **Component**: form validation, list virtualization, notification scheduling calls mocked
- **E2E**: Detox flows (add → reminder scheduled → list shows next due → export/import roundtrip)
- **Data migrations**: snapshot tests; migration from v1 → v2

---

## 15) Performance Notes
- Virtualized lists (FlashList or FlatList with getItemLayout when possible)
- DB queries paginated; compute upcoming with a bounded horizon (e.g., 90 days) to avoid combinatorial explosion
- Move heavy recurrence work to a background task when editing many items

---

## 16) Analytics (optional, privacy‑first)
- Local‑only counters (no network): items count, monthly spend; or fully disabled by default
- If remote analytics is ever added, present a clear opt‑in and keep a no‑network build flavor

---

## 17) Implementation Plan
**Phase 1 — Core data & CRUD**
- Scaffold RN app, theming, navigation
- SQLite schema + migrations; DAOs
- Add/Edit form, list, detail; recurrence util (monthly/weekly/yearly)
- Redux Toolkit slices for subscriptions and settings

**Phase 2 — Reminders & Upcoming view**
- Local notifications plumbing
- Next‑due computation & scheduling refresh
- Upcoming 30d, monthly totals

**Phase 3 — Backup/Import & Settings**
- JSON export/import with Zod validation
- Settings screen (currency, week start, theme)

**Phase 4 — Polish**
- Accessibility, empty states, undo delete, tests

(Post‑MVP tracks: intervals, analytics, attachments, widgets, secure lock.)

---

## 18) Risks & Mitigations
- **Date edge cases**: Exhaustive tests with fixed tz; explicit policies in UI
- **Notification limits**: Batch schedule next 6–12 months; refresh via background task
- **Data corruption on import**: Strong schema versioning + Zod validation + dry‑run summary
- **Performance on large lists**: Virtualization; denormalized `next_due_date` for quick ordering

---

## 19) Open Questions (for later)
- Do we need bi‑weekly/quarterly in MVP?
- Should we support multiple profiles (work vs personal)?
- Do we want iCloud/Drive auto‑backup opt‑in soon?

---

## 20) Appendices
### A) Minimal Schema (SQL‑ish)
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  price_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly','monthly','yearly')),
  interval INTEGER NOT NULL DEFAULT 1,
  anchor_date TEXT NOT NULL,
  by_month_day INTEGER,
  remind_days_before INTEGER NOT NULL DEFAULT 2,
  remind_time TEXT NOT NULL DEFAULT '09:00',
  category_id TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### B) TypeScript Models (sketch)
```ts
export type Frequency = 'weekly' | 'monthly' | 'yearly';
export interface Subscription {
  id: string;
  name: string;
  notes?: string;
  priceMinor: number; // integer minor units
  currency: string;   // ISO 4217
  frequency: Frequency;
  interval: number;   // default 1
  anchorDate: string; // YYYY-MM-DD
  byMonthDay?: number;
  remindDaysBefore: number;
  remindTime: string; // HH:mm
  categoryId?: string;
  tags?: string[];
  status: 'active' | 'paused' | 'canceled';
  createdAt: string;
  updatedAt: string;
}
```

### C) Recurrence Helpers (policy summary)
- Monthly: same day; if invalid → last day of month
- Yearly: same month/day; Feb 29 → Mar 1 (UI note)
- Weekly: same weekday; `interval` weeks

### D) Export Format (v1)
```json
{
  "version": 1,
  "exportedAt": "2025-11-05T19:00:00Z",
  "subscriptions": [
    {
      "id": "uuid",
      "name": "Netflix",
      "price_minor": 1299,
      "currency": "USD",
      "frequency": "monthly",
      "interval": 1,
      "anchor_date": "2025-01-15",
      "by_month_day": 15,
      "remind_days_before": 2,
      "remind_time": "09:00",
      "status": "active",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z"
    }
  ],
  "categories": []
}
```

