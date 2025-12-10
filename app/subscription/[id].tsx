import { deleteSubscription as deleteSubscriptionFromDB, getAllCategories, getAllSubscriptions, getCurrentDateTime, updateSubscription } from '@/database';
import { Category, Subscription } from '@/types/database';
import { calculateNextOccurrence, formatCurrency, formatDate, formatRelativeDate } from '@/utils/date';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SubscriptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [subs, cats] = await Promise.all([
        getAllSubscriptions(),
        getAllCategories(),
      ]);
      setSubscriptions(subs);
      setCategories(cats);
    };
    loadData();
  }, []);

  const subscription = subscriptions.find((s) => s.id === id);

  if (!subscription) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-lg text-muted-foreground">Subscription not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 rounded-lg bg-primary">
          <Text className="text-primary-foreground font-medium">Go Back</Text>
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
        return subscription.interval === 1 ? 'Weekly' : `Every ${subscription.interval} weeks`;
      case 'monthly':
        return subscription.interval === 1 ? 'Monthly' : `Every ${subscription.interval} months`;
      case 'yearly':
        return subscription.interval === 1 ? 'Yearly' : `Every ${subscription.interval} years`;
      default:
        return subscription.frequency;
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete "${subscription.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from database
              await deleteSubscriptionFromDB(subscription.id);
              
              // Navigate back
              router.back();
            } catch (error) {
              console.error('Error deleting subscription:', error);
              Alert.alert('Error', 'Failed to delete subscription. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePause = async () => {
    try {
      const newStatus = subscription.status === 'active' ? 'paused' : 'active';
      await updateSubscription({
        ...subscription,
        status: newStatus,
        updated_at: getCurrentDateTime(),
      });
      
      // Reload subscriptions to reflect the change
      const [subs] = await Promise.all([
        getAllSubscriptions(),
      ]);
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error updating subscription status:', error);
      Alert.alert('Error', 'Failed to update subscription status. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-12 pb-4 px-4 bg-card border-b border-border">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary font-medium">← Back</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-card-foreground flex-1" numberOfLines={1}>
              {subscription.name}
            </Text>
            <View className={`px-3 py-1 rounded ${getStatusColor()}`}>
              <Text className="text-xs font-medium capitalize">{subscription.status}</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handlePause}
              className={`px-4 py-2 rounded-lg ${
                subscription.status === 'active' 
                  ? 'bg-yellow-500 dark:bg-yellow-600' 
                  : 'bg-green-500 dark:bg-green-600'
              }`}>
              <Text className="text-white font-medium">
                {subscription.status === 'active' ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="px-4 py-2 rounded-lg bg-destructive">
              <Text className="text-destructive-foreground font-medium">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Price */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-sm mb-1 text-muted-foreground">Price</Text>
          <Text className="text-3xl font-bold text-card-foreground">
            {formatCurrency(subscription.price_minor, subscription.currency)}
          </Text>
          <Text className="text-sm mt-1 text-muted-foreground">{getFrequencyLabel()}</Text>
        </View>

        {/* Next Due Date */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-sm mb-1 text-muted-foreground">Next Due Date</Text>
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
            Details
          </Text>
          
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">Frequency</Text>
            <Text className="text-base mt-1 text-card-foreground">{getFrequencyLabel()}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">Anchor Date</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {formatDate(subscription.anchor_date)}
            </Text>
          </View>

          {subscription.by_month_day && (
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground">Day of Month</Text>
              <Text className="text-base mt-1 text-card-foreground">
                {subscription.by_month_day}
              </Text>
            </View>
          )}

          {category && (
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground">Category</Text>
              <Text className="text-base mt-1 text-card-foreground">{category.name}</Text>
            </View>
          )}

          {subscription.tags && (
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground">Tags</Text>
              <Text className="text-base mt-1 text-card-foreground">{subscription.tags}</Text>
            </View>
          )}
        </View>

        {/* Reminder Settings */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-lg font-semibold mb-3 text-card-foreground">
            Reminder Settings
          </Text>
          
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">Remind Before</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {subscription.remind_days_before} {subscription.remind_days_before === 1 ? 'day' : 'days'} before
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">Reminder Time</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {subscription.remind_time}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {subscription.notes && (
          <View className="mb-4 p-4 rounded-lg bg-card border border-border">
            <Text className="text-lg font-semibold mb-3 text-card-foreground">
              Notes
            </Text>
            <Text className="text-base text-card-foreground">{subscription.notes}</Text>
          </View>
        )}

        {/* Upcoming Occurrences */}
        <View className="mb-4 p-4 rounded-lg bg-card border border-border">
          <Text className="text-lg font-semibold mb-3 text-card-foreground">
            Upcoming Occurrences
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
            Metadata
          </Text>
          
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">Created</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {formatDate(subscription.created_at.split('T')[0])}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">Last Updated</Text>
            <Text className="text-base mt-1 text-card-foreground">
              {formatDate(subscription.updated_at.split('T')[0])}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
