import { deleteSubscription as deleteSubscriptionFromDB, getAllCategories, getAllSubscriptions, getCurrentDateTime, updateSubscription } from '@/database';
import { Category, Subscription } from '@/types/database';
import { calculateNextOccurrence, formatCurrency, formatDate, formatRelativeDate } from '@/utils/date';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubscriptionDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadData = useCallback(async () => {
    const [subs, cats] = await Promise.all([
      getAllSubscriptions(),
      getAllCategories(),
    ]);
    setSubscriptions(subs);
    setCategories(cats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const subscription = subscriptions.find((s) => s.id === id);

  if (!subscription) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-lg text-muted-foreground">{t('subscription.notFound')}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 rounded-lg bg-primary">
          <Text className="text-primary-foreground font-medium">{t('subscription.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = subscription.category_id
    ? categories.find((c) => c.id === subscription.category_id)
    : null;

  const nextOccurrences = calculateNextOccurrence(subscription, 5);
  const nextDue = nextOccurrences[0];

  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'canceled':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  };

  const getFrequencyLabel = () => {
    switch (subscription.frequency) {
      case 'weekly':
        return subscription.interval === 1 
          ? t('subscription.frequencies.weekly') 
          : t('subscription.frequencies.everyWeeks', { count: subscription.interval });
      case 'monthly':
        return subscription.interval === 1 
          ? t('subscription.frequencies.monthly') 
          : t('subscription.frequencies.everyMonths', { count: subscription.interval });
      case 'yearly':
        return subscription.interval === 1 
          ? t('subscription.frequencies.yearly') 
          : t('subscription.frequencies.everyYears', { count: subscription.interval });
      default:
        return subscription.frequency;
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('subscription.deleteTitle'),
      t('subscription.deleteConfirm', { name: subscription.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from database
              await deleteSubscriptionFromDB(subscription.id);
              
              // Navigate back
              router.back();
            } catch (error) {
              console.error('Error deleting subscription:', error);
              Alert.alert(t('common.error'), t('subscription.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handlePause = () => {
    const action = subscription.status === 'active' ? 'pause' : 'resume';
    const actionLabel = subscription.status === 'active' ? t('subscription.pause') : t('subscription.resume');
    
    Alert.alert(
      t('subscription.statusUpdateTitle', { action: actionLabel }),
      t('subscription.statusUpdateConfirm', { action: action === 'pause' ? t('subscription.pauseAction') : t('subscription.resumeAction'), name: subscription.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: actionLabel,
          onPress: async () => {
            try {
              const newStatus = subscription.status === 'active' ? 'paused' : 'active';
              await updateSubscription({
                ...subscription,
                status: newStatus,
                updated_at: getCurrentDateTime(),
              });
              
              // Reload subscriptions to reflect the change
              loadData();
            } catch (error) {
              console.error('Error updating subscription status:', error);
              Alert.alert(t('common.error'), t('subscription.statusUpdateError'));
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pb-4 px-4 bg-card border-b border-border" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary font-medium">← {t('common.back')}</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-card-foreground flex-1" numberOfLines={1}>
              {subscription.name}
            </Text>
            <View className={`px-3 py-1 rounded ${getStatusColor()}`}>
              <Text className="text-xs font-medium capitalize">
                {t(`subscription.statuses.${subscription.status}`)}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handlePause}
              className={`px-4 py-2 rounded-xl border ${
                subscription.status === 'active' 
                  ? 'border-yellow-500 dark:border-yellow-600' 
                  : 'border-green-500 dark:border-green-600'
              }`}>
              <Text className="text-foreground font-medium">
                {subscription.status === 'active' ? t('subscription.pause') : t('subscription.resume')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="px-4 py-2 rounded-xl border border-destructive">
              <Text className="text-foreground font-medium">{t('common.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Price */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-sm mb-1 text-muted-foreground">{t('subscription.price')}</Text>
          <Text className="text-3xl font-bold text-card-foreground">
            {formatCurrency(subscription.price_minor, subscription.currency)}
          </Text>
          <Text className="text-sm mt-1 text-muted-foreground">{getFrequencyLabel()}</Text>
        </View>

        {/* Next Due Date */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-sm mb-1 text-muted-foreground">{t('subscription.nextDueDate')}</Text>
          <Text className="text-xl font-semibold text-card-foreground">
            {formatRelativeDate(nextDue)}
          </Text>
          <Text className="text-sm mt-1 text-muted-foreground">
            {formatDate(nextDue)}
          </Text>
        </View>

        {/* Subscription Details */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-lg font-semibold mb-3 text-card-foreground">
            {t('subscription.details')}
          </Text>
          
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">{t('subscription.frequency')}</Text>
            <Text className="text-base mt-1 text-card-foreground">{getFrequencyLabel()}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">{t('subscription.anchorDate')}</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {formatDate(subscription.anchor_date)}
            </Text>
          </View>

          {subscription.by_month_day && (
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground">{t('subscription.dayOfMonth')}</Text>
              <Text className="text-base mt-1 text-card-foreground">
                {subscription.by_month_day}
              </Text>
            </View>
          )}

          {category && (
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground">{t('subscription.category')}</Text>
              <Text className="text-base mt-1 text-card-foreground">{category.name}</Text>
            </View>
          )}

          {subscription.tags && (
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground">{t('subscription.tags')}</Text>
              <Text className="text-base mt-1 text-card-foreground">{subscription.tags}</Text>
            </View>
          )}
        </View>

        {/* Reminder Settings */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-lg font-semibold mb-3 text-card-foreground">
            {t('subscription.reminders')}
          </Text>
          
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">{t('subscription.remindBefore')}</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {t('subscription.reminderBeforeValue', { count: subscription.remind_days_before })}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">{t('subscription.reminderTime')}</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {subscription.remind_time}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {subscription.notes && (
          <View className="mb-4 p-4 rounded-lg bg-card border border-border">
            <Text className="text-lg font-semibold mb-3 text-card-foreground">
              {t('subscription.notes')}
            </Text>
            <Text className="text-base text-card-foreground">{subscription.notes}</Text>
          </View>
        )}

        {/* Upcoming Occurrences */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-lg font-semibold mb-3 text-card-foreground">
            {t('subscription.upcomingOccurrences')}
          </Text>
          {nextOccurrences.map((date, index) => (
            <View key={index} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
              <Text className="text-base text-card-foreground">
                {index + 1}. {formatDate(date)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {formatRelativeDate(date)}
              </Text>
            </View>
          ))}
        </View>

        {/* Metadata */}
        <View className="mb-8 p-4 rounded-lg bg-card border border-border">
          <Text className="text-lg font-semibold mb-3 text-card-foreground">
            {t('subscription.metadata')}
          </Text>
          
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">{t('subscription.created')}</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {formatDate(subscription.created_at.split('T')[0])}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">{t('subscription.lastUpdated')}</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {formatDate(subscription.updated_at.split('T')[0])}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
