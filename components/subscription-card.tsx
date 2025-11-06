import { Subscription } from '@/types/database';
import { calculateNextOccurrence, formatCurrency, formatRelativeDate } from '@/utils/date';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const router = useRouter();
  const nextDue = calculateNextOccurrence(subscription, 1)[0];

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

  return (
    <TouchableOpacity
      onPress={() => router.push(`/subscription/${subscription.id}`)}
      className="mb-3 rounded-lg p-4 bg-card border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-card-foreground">
            {subscription.name}
          </Text>
          <Text className="text-sm mt-1 text-muted-foreground">
            {getFrequencyLabel()}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded ${getStatusColor()}`}>
          <Text className="text-xs font-medium">{subscription.status}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-3">
        <View>
          <Text className="text-2xl font-bold text-card-foreground">
            {formatCurrency(subscription.price_minor, subscription.currency)}
          </Text>
          <Text className="text-xs mt-1 text-muted-foreground">
            Next: {formatRelativeDate(nextDue)}
          </Text>
        </View>

        {subscription.remind_days_before > 0 && (
          <View className="px-2 py-1 rounded bg-accent">
            <Text className="text-xs font-medium text-accent-foreground">
              Reminder {subscription.remind_days_before}d before
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

