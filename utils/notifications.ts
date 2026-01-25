import {
  deleteRemindersBySubscription,
  getRemindersBySubscription,
  saveReminder,
} from "@/database/reminders";
import { generateUUID, getCurrentDateTime } from "@/database/utils";
import { Subscription } from "@/types/database";
import { calculateNextOccurrence } from "@/utils/date";
import dayjs from "dayjs";
import * as Notifications from "expo-notifications";
import i18n from "@/i18n";

const SCHEDULE_AHEAD_COUNT = 6; // Schedule notifications for the next 6 billing occurrences

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowList: false,
  }),
});

/**
 * Cancels all scheduled notifications and removes reminder records for a subscription.
 * Call this before re-scheduling (e.g. on subscription update) or when notify_me is turned off.
 */
export async function cancelNotificationsForSubscription(
  subscriptionId: string,
): Promise<void> {
  const reminders = await getRemindersBySubscription(subscriptionId);
  for (const r of reminders) {
    if (r.status === "scheduled") {
      try {
        await Notifications.cancelScheduledNotificationAsync(r.id);
      } catch {
        // Ignore if notification was already fired or canceled
      }
    }
  }
  await deleteRemindersBySubscription(subscriptionId);
}

/**
 * Schedules local notifications for a subscription based on notify_me, remind_days_before,
 * and remind_time. If notify_me is false, cancels any existing reminders and does not schedule.
 * If notify_me is true (or undefined for backward compat), cancels existing reminders and
 * creates new ones for the next N billing dates at (due_date - remind_days_before) at remind_time.
 */
export async function scheduleNotificationsForSubscription(
  subscription: Subscription,
): Promise<void> {
  await cancelNotificationsForSubscription(subscription.id);

  if (subscription.notify_me === false) {
    return;
  }

  const { remind_days_before, remind_time } = subscription;
  const [hourStr, minuteStr] = (remind_time || "09:00").split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const dueDates = calculateNextOccurrence(subscription, SCHEDULE_AHEAD_COUNT);
  const now = dayjs();

  for (const dueDateStr of dueDates) {
    // Fire at: (due_date - remind_days_before) at remind_time
    const fireDate = dayjs(dueDateStr)
      .subtract(remind_days_before, "day")
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0);
    console.log("fireDate", fireDate);
    if (fireDate.isBefore(now)) {
      continue; // Skip if the reminder time is in the past
    }

    const id = generateUUID();
    const fireDatetime = fireDate.toISOString();

    await saveReminder({
      id,
      subscription_id: subscription.id,
      fire_datetime: fireDatetime,
      status: "scheduled",
      created_at: getCurrentDateTime(),
      updated_at: getCurrentDateTime(),
    });

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: i18n.t('notifications.reminderTitle'),
          body: i18n.t('notifications.reminderBody', {
            name: subscription.name,
            date: dayjs(dueDateStr).format("LL")
          }),
          data: { subscriptionId: subscription.id, dueDate: dueDateStr },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireDate.toDate(),
        },
      });
    } catch (err) {
      console.warn("Failed to schedule notification:", err);
      // Reminder record is still in DB; could be cleaned up or retried later
    }
  }
}

/**
 * Sends a test notification immediately for development/debugging.
 * Use from Settings or similar to verify notification permissions and display.
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.testTitle'),
      body: i18n.t('notifications.testBody'),
      data: { _test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}
