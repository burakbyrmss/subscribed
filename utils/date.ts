import { Subscription } from "@/types/database";
import dayjs from "dayjs";
import i18n from "@/i18n";

export function formatCurrency(
  amountMinor: number,
  currency: string = "USD",
): string {
  const amount = amountMinor / 100;
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formattedAmount} ${currency}`;
}

export function calculateNextOccurrence(
  subscription: Subscription,
  count: number = 1,
): string[] {
  const occurrences: string[] = [];
  const anchorDate = dayjs(subscription.anchor_date);
  let currentDate = anchorDate;

  // If anchor date is in the past, calculate from today
  if (anchorDate.isBefore(dayjs(), "day")) {
    // Find the next occurrence from today
    while (currentDate.isBefore(dayjs(), "day")) {
      currentDate = getNextDate(currentDate, subscription);
    }
  }

  for (let i = 0; i < count; i++) {
    occurrences.push(currentDate.format("YYYY-MM-DD"));
    currentDate = getNextDate(currentDate, subscription);
  }

  return occurrences;
}

function getNextDate(
  currentDate: dayjs.Dayjs,
  subscription: Subscription,
): dayjs.Dayjs {
  const { frequency, interval, by_month_day } = subscription;

  switch (frequency) {
    case "weekly":
      return currentDate.add(interval, "week");
    case "monthly":
      if (by_month_day) {
        // Try to get the same day of month, or last day if not available
        const targetDay = Math.min(by_month_day, currentDate.daysInMonth());
        return currentDate.add(interval, "month").date(targetDay);
      }
      return currentDate.add(interval, "month");
    case "yearly":
      return currentDate.add(interval, "year");
    default:
      return currentDate;
  }
}

export function formatDate(dateString: string): string {
  // Use localized format
  return dayjs(dateString).format("LL");
}

export function formatRelativeDate(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs().startOf("day");
  const diff = date.diff(today, "day");

  if (diff === 0) return i18n.t('dates.today');
  if (diff === 1) return i18n.t('dates.tomorrow');
  if (diff === -1) return i18n.t('dates.yesterday');
  if (diff > 0 && diff <= 7) return i18n.t('dates.inDays', { count: diff });
  if (diff < 0 && diff >= -7) return i18n.t('dates.daysAgo', { count: Math.abs(diff) });
  return formatDate(dateString);
}
