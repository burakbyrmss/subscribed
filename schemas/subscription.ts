import { z } from 'zod';

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').nullable(),
  price_minor: z.number().int().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (ISO 4217)'),
  frequency: z.enum(['weekly', 'monthly', 'yearly'], {
    errorMap: () => ({ message: 'Frequency must be weekly, monthly, or yearly' }),
  }),
  interval: z.number().int().positive().default(1),
  anchor_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  by_month_day: z.number().int().min(1).max(31).nullable(),
  remind_days_before: z.number().int().min(0).max(30).default(2),
  remind_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'),
  category_id: z.string().uuid().nullable(),
  tags: z.string().nullable(),
  status: z.enum(['active', 'paused', 'canceled']).default('active'),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

