import { generateUUID, getCurrentDateTime } from '@/database';
import { SubscriptionFormData, subscriptionSchema } from '@/schemas/subscription';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addSubscription } from '@/store/slices/subscriptionsSlice';
import { Subscription } from '@/types/database';
import { calculateNextOccurrence, formatDate } from '@/utils/date';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Note: You'll need to install react-hook-form and @hookform/resolvers
// npm install react-hook-form @hookform/resolvers

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings.settings);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: '',
      notes: null,
      price_minor: 0,
      currency: settings.currency_default || 'USD',
      frequency: 'monthly',
      interval: 1,
      anchor_date: dayjs().format('YYYY-MM-DD'),
      by_month_day: null,
      remind_days_before: 2,
      remind_time: '09:00',
      category_id: null,
      tags: null,
      status: 'active',
    },
  });

  const formData = watch();
  const nextOccurrences = formData.anchor_date && formData.frequency
    ? calculateNextOccurrence(
        {
          ...formData,
          id: '',
          created_at: '',
          updated_at: '',
        } as Subscription,
        3
      )
    : [];

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      const subscription: Subscription = {
        id: generateUUID(),
        ...data,
        created_at: getCurrentDateTime(),
        updated_at: getCurrentDateTime(),
      };

      // TODO: Save to database
      // await saveSubscriptionToDatabase(subscription);

      dispatch(addSubscription(subscription));
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save subscription');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">
            Add Subscription
          </Text>
        </View>

        {/* Name */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">
            Name *
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Netflix, Spotify, etc."
                className={`p-3 rounded-lg border bg-card border-input text-card-foreground ${
                  errors.name ? 'border-destructive' : ''
                }`}
              />
            )}
          />
          {errors.name && (
            <Text className="mt-1 text-sm text-destructive">{errors.name.message}</Text>
          )}
        </View>

        {/* Price */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">
            Price *
          </Text>
          <Controller
            control={control}
            name="price_minor"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value ? (value / 100).toString() : ''}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  onChange(Math.round(num * 100));
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                className="p-3 rounded-lg border bg-card border-input text-card-foreground"
              />
            )}
          />
          {errors.price_minor && (
            <Text className="mt-1 text-sm text-destructive">{errors.price_minor.message}</Text>
          )}
        </View>

        {/* Frequency */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">
            Frequency *
          </Text>
          <Controller
            control={control}
            name="frequency"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row">
                {(['weekly', 'monthly', 'yearly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    onPress={() => onChange(freq)}
                    className={`flex-1 py-3 px-4 rounded-lg mr-2 border ${
                      value === freq
                        ? 'bg-primary border-primary'
                        : 'bg-card border-border'
                    }`}>
                    <Text
                      className={`text-center font-medium ${
                        value === freq ? 'text-primary-foreground' : 'text-card-foreground'
                      }`}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Anchor Date */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">
            First Billing Date *
          </Text>
          <Controller
            control={control}
            name="anchor_date"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="YYYY-MM-DD"
                className="p-3 rounded-lg border bg-card border-input text-card-foreground"
              />
            )}
          />
        </View>

        {/* Reminder Settings */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">
            Reminder
          </Text>
          <View className="flex-row items-center">
            <Controller
              control={control}
              name="remind_days_before"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 0)}
                  keyboardType="number-pad"
                  className="flex-1 p-3 rounded-lg border mr-2 bg-card border-input text-card-foreground"
                />
              )}
            />
            <Text className="text-foreground">days before</Text>
          </View>
        </View>

        {/* Next Occurrences Preview */}
        {nextOccurrences.length > 0 && (
          <View className="mb-4 p-4 rounded-lg bg-card">
            <Text className="mb-2 font-semibold text-card-foreground">
              Next 3 Occurrences:
            </Text>
            {nextOccurrences.map((date, index) => (
              <Text key={index} className="text-muted-foreground">
                {index + 1}. {formatDate(date)}
              </Text>
            ))}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          className="py-4 px-6 rounded-lg mb-8 bg-primary">
          <Text className="text-center text-primary-foreground font-semibold text-lg">Save Subscription</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

