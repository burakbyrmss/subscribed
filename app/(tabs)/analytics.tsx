import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { formatCurrency, calculateNextOccurrence } from '@/utils/date';
import dayjs from 'dayjs';

export default function AnalyticsScreen() {
  const subscriptions = useAppSelector((state) => state.subscriptions.subscriptions);
  const categories = useAppSelector((state) => state.categories.categories);
  const settings = useAppSelector((state) => state.settings.settings);

  const currentMonth = dayjs().month();
  const currentYear = dayjs().year();

  const analytics = useMemo(() => {
    const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');

    // Calculate current month total
    const currentMonthTotal = activeSubscriptions.reduce((total, sub) => {
      const occurrences = calculateNextOccurrence(sub, 12); // Get next 12 occurrences
      const monthOccurrences = occurrences.filter((date) => {
        const d = dayjs(date);
        return d.month() === currentMonth && d.year() === currentYear;
      });
      return total + sub.price_minor * monthOccurrences.length;
    }, 0);

    // Per-category breakdown
    const categoryBreakdown: Record<string, { total: number; count: number }> = {};
    activeSubscriptions.forEach((sub) => {
      const categoryId = sub.category_id || 'uncategorized';
      const categoryName =
        categories.find((c) => c.id === categoryId)?.name || 'Uncategorized';

      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = { total: 0, count: 0 };
      }

      const occurrences = calculateNextOccurrence(sub, 12);
      const monthOccurrences = occurrences.filter((date) => {
        const d = dayjs(date);
        return d.month() === currentMonth && d.year() === currentYear;
      });

      categoryBreakdown[categoryName].total += sub.price_minor * monthOccurrences.length;
      categoryBreakdown[categoryName].count += 1;
    });

    return {
      currentMonthTotal,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: currentMonthTotal > 0 ? (data.total / currentMonthTotal) * 100 : 0,
      })),
    };
  }, [subscriptions, categories, currentMonth, currentYear]);

  const currency = settings.currency_default || 'USD';

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">
            Analytics
          </Text>
          <Text className="text-sm mt-1 text-muted-foreground">
            {dayjs().format('MMMM YYYY')}
          </Text>
        </View>

        {/* Current Month Total */}
        <View className="mb-6 p-6 rounded-lg bg-card">
          <Text className="text-sm font-medium mb-2 text-muted-foreground">
            Current Month Total
          </Text>
          <Text className="text-4xl font-bold text-card-foreground">
            {formatCurrency(analytics.currentMonthTotal, currency)}
          </Text>
        </View>

        {/* Category Breakdown */}
        <View className="mb-6">
          <Text className="text-xl font-bold mb-4 text-foreground">
            By Category
          </Text>

          {analytics.categoryBreakdown.length === 0 ? (
            <Text className="text-muted-foreground">
              No active subscriptions this month
            </Text>
          ) : (
            analytics.categoryBreakdown.map((category, index) => (
              <View
                key={index}
                className="mb-4 p-4 rounded-lg bg-card">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-semibold text-card-foreground">
                    {category.name}
                  </Text>
                  <Text className="font-semibold text-card-foreground">
                    {formatCurrency(category.total, currency)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View
                    className="h-2 rounded-full mr-2 bg-muted"
                    style={{ flex: 1 }}>
                    <View
                      className={`h-2 rounded-full ${
                        index % 2 === 0 ? 'bg-primary' : 'bg-green-500'
                      }`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </View>
                  <Text className="text-sm text-muted-foreground">
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
                <Text className="text-xs mt-1 text-muted-foreground">
                  {category.count} subscription{category.count !== 1 ? 's' : ''}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
