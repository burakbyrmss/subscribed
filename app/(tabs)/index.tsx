import { FilterBar } from '@/components/filter-bar';
import { SubscriptionCard } from '@/components/subscription-card';
import { useAppSelector } from '@/store/hooks';
import { calculateNextOccurrence } from '@/utils/date';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Segment = 'upcoming' | 'all' | 'canceled';

export default function HomeScreen() {
  const subscriptions = useAppSelector((state) => state.subscriptions.subscriptions);
  const categories = useAppSelector((state) => state.categories.categories);

  const [segment, setSegment] = useState<Segment>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    // Filter by segment
    if (segment === 'upcoming') {
      const thirtyDaysFromNow = dayjs().add(30, 'days');
      filtered = filtered.filter((sub) => {
        if (sub.status !== 'active') return false;
        const nextDue = calculateNextOccurrence(sub, 1)[0];
        return dayjs(nextDue).isBefore(thirtyDaysFromNow) || dayjs(nextDue).isSame(thirtyDaysFromNow, 'day');
      });
    } else if (segment === 'canceled') {
      filtered = filtered.filter((sub) => sub.status === 'canceled');
    } else {
      // All - show all except canceled
      filtered = filtered.filter((sub) => sub.status !== 'canceled');
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

    // Sort by next due date for upcoming, by name for others
    if (segment === 'upcoming') {
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
    { key: 'upcoming', label: 'Upcoming (30d)' },
    { key: 'all', label: 'All' },
    { key: 'canceled', label: 'Canceled' },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-12 pb-4 px-4 bg-card">
        <Text className="text-3xl font-bold text-card-foreground">
          Subscriptions
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
              No subscriptions found
            </Text>
            <Text className="text-sm mt-2 text-muted-foreground">
              {searchQuery || selectedCategory
                ? 'Try adjusting your filters'
                : 'Add your first subscription to get started'}
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
