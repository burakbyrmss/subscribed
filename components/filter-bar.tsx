import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  categories: { id: string; name: string }[];
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: FilterBarProps) {
  const { theme } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const isDark = theme === 'dark';

  return (
    <View className="bg-card p-4">
      <View className="flex-row items-center rounded-lg px-3 py-2 bg-secondary">
        <Text className="mr-2 text-muted-foreground">🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search subscriptions..."
          placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
          className="flex-1 text-card-foreground"
        />
      </View>

      {showFilters && (
        <View className="mt-3">
          <Text className="mb-2 text-sm font-medium text-card-foreground">
            Category
          </Text>
          <View className="flex-row flex-wrap">
            <TouchableOpacity
              onPress={() => onCategoryChange(null)}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                selectedCategory === null
                  ? 'bg-primary'
                  : 'bg-secondary'
              }`}>
              <Text
                className={`text-xs ${
                  selectedCategory === null
                    ? 'text-primary-foreground'
                    : 'text-secondary-foreground'
                }`}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => onCategoryChange(category.id)}
                className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                  selectedCategory === category.id
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}>
                <Text
                  className={`text-xs ${
                    selectedCategory === category.id
                      ? 'text-primary-foreground'
                      : 'text-secondary-foreground'
                  }`}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={() => setShowFilters(!showFilters)}
        className="mt-2 self-start">
        <Text className="text-sm text-primary">
          {showFilters ? 'Hide filters' : 'Show filters'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
