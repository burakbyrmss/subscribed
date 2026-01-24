import { getAllCategories, getAllSettings, getAllSubscriptions } from '@/database';
import { Category, SettingKey, Subscription } from '@/types/database';
import { calculateNextOccurrence, formatCurrency } from '@/utils/date';
import dayjs from 'dayjs';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function AnalyticsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<SettingKey, string>>({
    currency_default: 'USD',
    first_day_of_week: '1',
    locale: 'en-US',
    theme: 'dark',
    backup_hint_dismissed: 'false',
  });

  const loadData = useCallback(async () => {
    const [subs, cats, settingsData] = await Promise.all([
      getAllSubscriptions(),
      getAllCategories(),
      getAllSettings(),
    ]);
    setSubscriptions(subs);
    setCategories(cats);
    
    // Convert settings array to Record format
    const settingsRecord = settingsData.reduce((acc, setting) => {
      acc[setting.key as SettingKey] = setting.value;
      return acc;
    }, {} as Record<SettingKey, string>);
    setSettings((prevSettings) => ({ ...prevSettings, ...settingsRecord }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const currentMonth = dayjs().month();
  const currentYear = dayjs().year();

  const analytics = useMemo(() => {
    const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');

    // Calculate current month total per currency
    const currentMonthTotalByCurrency: Record<string, number> = {};
    activeSubscriptions.forEach((sub) => {
      const occurrences = calculateNextOccurrence(sub, 12); // Get next 12 occurrences
      const monthOccurrences = occurrences.filter((date) => {
        const d = dayjs(date);
        return d.month() === currentMonth && d.year() === currentYear;
      });
      
      if (!currentMonthTotalByCurrency[sub.currency]) {
        currentMonthTotalByCurrency[sub.currency] = 0;
      }
      currentMonthTotalByCurrency[sub.currency] += sub.price_minor * monthOccurrences.length;
    });

    // Per-category breakdown per currency
    const categoryBreakdown: Record<string, Record<string, { total: number; count: number }>> = {};
    activeSubscriptions.forEach((sub) => {
      const categoryId = sub.category_id || 'uncategorized';
      const categoryName =
        categories.find((c) => c.id === categoryId)?.name || 'Uncategorized';

      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {};
      }

      if (!categoryBreakdown[categoryName][sub.currency]) {
        categoryBreakdown[categoryName][sub.currency] = { total: 0, count: 0 };
      }

      const occurrences = calculateNextOccurrence(sub, 12);
      const monthOccurrences = occurrences.filter((date) => {
        const d = dayjs(date);
        return d.month() === currentMonth && d.year() === currentYear;
      });

      categoryBreakdown[categoryName][sub.currency].total += sub.price_minor * monthOccurrences.length;
      categoryBreakdown[categoryName][sub.currency].count += 1;
    });

    // Flatten category breakdown to show each category-currency combination
    const categoryBreakdownList: { name: string; currency: string; total: number; count: number; percentage: number }[] = [];
    Object.entries(categoryBreakdown).forEach(([categoryName, currencies]) => {
      Object.entries(currencies).forEach(([currency, data]) => {
        const currencyTotal = currentMonthTotalByCurrency[currency] || 0;
        categoryBreakdownList.push({
          name: categoryName,
          currency,
          total: data.total,
          count: data.count,
          percentage: currencyTotal > 0 ? (data.total / currencyTotal) * 100 : 0,
        });
      });
    });

    return {
      currentMonthTotalByCurrency: Object.entries(currentMonthTotalByCurrency).map(([currency, total]) => ({
        currency,
        total,
      })),
      categoryBreakdown: categoryBreakdownList,
    };
  }, [subscriptions, categories, currentMonth, currentYear]);

  return (
    <View className="flex-1 bg-background">
            <View className="pt-12 pb-4 px-4 bg-card">
        <Text className="text-3xl font-bold text-card-foreground">
          Analytics
        </Text>
        <Text className="text-sm mt-1 text-muted-foreground">
            {dayjs().format('MMMM YYYY')}
          </Text>
      </View>
      <ScrollView className="flex-1 px-4">

        {/* Current Month Total by Currency */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-3 text-muted-foreground">
            Current Month Total
          </Text>
          {analytics.currentMonthTotalByCurrency.length === 0 ? (
            <View className="p-6 rounded-lg bg-card">
              <Text className="text-muted-foreground">
                No active subscriptions this month
              </Text>
            </View>
          ) : (
            analytics.currentMonthTotalByCurrency.map(({ currency, total }) => (
              <View key={currency} className="mb-3 p-6 rounded-lg bg-card">
                <Text className="text-xs font-medium mb-1 text-muted-foreground uppercase">
                  {currency}
                </Text>
                <Text className="text-4xl font-bold text-card-foreground">
                  {formatCurrency(total, currency)}
                </Text>
              </View>
            ))
          )}
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
                key={`${category.name}-${category.currency}-${index}`}
                className="mb-4 p-4 rounded-lg bg-card">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-1">
                    <Text className="font-semibold text-card-foreground">
                      {category.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground uppercase mt-0.5">
                      {category.currency}
                    </Text>
                  </View>
                  <Text className="font-semibold text-card-foreground">
                    {formatCurrency(category.total, category.currency)}
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
