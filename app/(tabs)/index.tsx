import { FilterBar } from '@/components/filter-bar';
import { SubscriptionCard } from '@/components/subscription-card';
import { getAllCategories, getAllSubscriptions } from '@/database';
import { Category, Subscription } from '@/types/database';
import { calculateNextOccurrence } from '@/utils/date';
import dayjs from 'dayjs';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Segment = 'active' | 'all' | 'paused';

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  const [segment, setSegment] = useState<Segment>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    // Filter by segment
    if (segment === 'active') {
      filtered = filtered.filter((sub) => sub.status === 'active');
    } else if (segment === 'paused') {
      filtered = filtered.filter((sub) => sub.status === 'paused');
    } else {
      // All - show all subscriptions
      // No filtering needed
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.name.toLowerCase().includes(query) ||
          sub.notes?.toLowerCase().includes(query) ||
          sub.tags?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((sub) => sub.category_id === selectedCategory);
    }

    // Sort by next due date for active, by name for others
    if (segment === 'active' || segment === 'all') {
      filtered.sort((a, b) => {
        const nextA = calculateNextOccurrence(a, 1)[0];
        const nextB = calculateNextOccurrence(b, 1)[0];
        return dayjs(nextA).diff(dayjs(nextB));
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [subscriptions, segment, searchQuery, selectedCategory]);

  const segments: { key: Segment; label: string }[] = [
    { key: 'active', label: t('home.segments.active') },
    { key: 'all', label: t('home.segments.all') },
    { key: 'paused', label: t('home.segments.paused') },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pb-4 px-4 bg-card" style={{ paddingTop: insets.top }}>
        <Text className="text-3xl font-bold text-card-foreground">
          {t('tabs.subscriptions')}
        </Text>
      </View>

      {/* Segments */}
      <View className="flex-row px-4 py-2 bg-card border-b border-border">
        {segments.map((seg) => (
          <TouchableOpacity
            key={seg.key}
            onPress={() => setSegment(seg.key)}
            className={`flex-1 py-2 px-4 rounded-lg mr-2 ${
              segment === seg.key
                ? 'bg-primary'
                : 'bg-secondary'
            }`}>
            <Text
              className={`text-center font-medium ${
                segment === seg.key ? 'text-primary-foreground' : 'text-secondary-foreground'
              }`}>
              {seg.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      {/* Subscriptions List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {filteredSubscriptions.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-lg text-muted-foreground">
              {t('home.empty.title')}
            </Text>
            <Text className="text-sm mt-2 text-muted-foreground">
              {searchQuery || selectedCategory
                ? t('home.empty.adjustFilters')
                : t('home.empty.getStarted')}
            </Text>
          </View>
        ) : (
          filteredSubscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.id} subscription={subscription} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
