import { Subscription } from '@/types/database';
import dayjs from 'dayjs';

export function formatCurrency(amountMinor: number, currency: string = 'USD'): string {
  const amount = amountMinor / 100;
  // Format number with 2 decimal places and add currency code
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formattedAmount} ${currency}`;
}

export function calculateNextOccurrence(
  subscription: Subscription,
  count: number = 1
): string[] {
  const occurrences: string[] = [];
  const anchorDate = dayjs(subscription.anchor_date);
  let currentDate = anchorDate;

  // If anchor date is in the past, calculate from today
  if (anchorDate.isBefore(dayjs(), 'day')) {
    // Find the next occurrence from today
    while (currentDate.isBefore(dayjs(), 'day')) {
      currentDate = getNextDate(currentDate, subscription);
    }
  }

  for (let i = 0; i < count; i++) {
    occurrences.push(currentDate.format('YYYY-MM-DD'));
    currentDate = getNextDate(currentDate, subscription);
  }

  return occurrences;
}

function getNextDate(currentDate: dayjs.Dayjs, subscription: Subscription): dayjs.Dayjs {
  const { frequency, interval, by_month_day } = subscription;

  switch (frequency) {
    case 'weekly':
      return currentDate.add(interval, 'week');
    case 'monthly':
      if (by_month_day) {
        // Try to get the same day of month, or last day if not available
        const targetDay = Math.min(by_month_day, currentDate.daysInMonth());
        return currentDate.add(interval, 'month').date(targetDay);
      }
      return currentDate.add(interval, 'month');
    case 'yearly':
      return currentDate.add(interval, 'year');
    default:
      return currentDate;
  }
}

export function formatDate(dateString: string): string {
  return dayjs(dateString).format('MMM D, YYYY');
}

export function formatRelativeDate(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs().startOf('day');
  const diff = date.diff(today, 'day');

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff <= 7) return `In ${diff} days`;
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return formatDate(dateString);
}

