import { FormInput, FormSelect } from '@/components/form';
import { generateUUID, getCurrentDateTime } from '@/database';
import { SubscriptionFormData, subscriptionSchema } from '@/schemas/subscription';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addSubscription } from '@/store/slices/subscriptionsSlice';
import { Subscription } from '@/types/database';
import { calculateNextOccurrence, formatDate } from '@/utils/date';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, FormProvider, Resolver, SubmitHandler, useForm } from 'react-hook-form';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Date Picker Component for string-based date fields
function DatePickerField({
  value,
  onChange,
  error,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: { message?: string };
  label: string;
}) {
  const [show, setShow] = useState(false);
  const dateValue = value ? dayjs(value).toDate() : new Date();
  const [internalDate, setInternalDate] = useState<Date>(dateValue);

  useEffect(() => {
    if (value) {
      setInternalDate(dayjs(value).toDate());
    }
  }, [value]);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (event.type === 'set' && selectedDate) {
      setInternalDate(selectedDate);
      onChange(dayjs(selectedDate).format('YYYY-MM-DD'));
      if (Platform.OS === 'ios') {
        setShow(false);
      }
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'YYYY-MM-DD';
    return dayjs(dateStr).format('YYYY-MM-DD');
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium text-foreground">{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className={`p-3 rounded-lg border bg-card border-input ${
          error ? 'border-destructive' : ''
        }`}>
        <Text className="text-card-foreground">{formatDate(value)}</Text>
      </TouchableOpacity>
      {error && (
        <Text className="mt-1 text-sm text-destructive">{error.message}</Text>
      )}

      {show && (
        <>
          {Platform.OS === 'ios' && (
            <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
              <View className="bg-card rounded-lg p-4 w-[90%] max-w-sm">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-semibold text-card-foreground">
                    {label}
                  </Text>
                  <TouchableOpacity onPress={() => setShow(false)}>
                    <Text className="text-primary font-medium">Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={internalDate}
                  mode="date"
                  display="spinner"
                  onChange={handleChange}
                  style={{ backgroundColor: 'transparent' }}
                />
              </View>
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={internalDate}
              mode="date"
              display="default"
              onChange={handleChange}
            />
          )}
        </>
      )}
    </View>
  );
}

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings.settings);

  const formMethods = useForm<SubscriptionFormData, any, SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema) as Resolver<SubscriptionFormData, any, SubscriptionFormData>,
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

  const { control, handleSubmit, watch } = formMethods;

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

  const onSubmit: SubmitHandler<SubscriptionFormData> = async (data) => {
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
    <FormProvider {...formMethods}>
      <View className="flex-1 bg-background">
        <View className="pt-12 pb-4 px-4 bg-card">
          <Text className="text-3xl font-bold text-card-foreground">
            Add Subscription
          </Text>
        </View>
        <ScrollView className="flex-1 px-4">
        {/* Name */}
        <FormInput
          label="Name *"
          name="name"
          placeholder="Netflix, Spotify, etc."
        />

        {/* Price */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">
            Price *
          </Text>
          <Controller
            control={control}
            name="price_minor"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <View className={`p-3 rounded-lg border bg-card border-input ${
                  error ? 'border-destructive' : ''
                }`}>
                  <TextInput
                    value={value ? (value / 100).toString() : ''}
                    onChangeText={(text) => {
                      const num = parseFloat(text) || 0;
                      onChange(Math.round(num * 100));
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    className="text-card-foreground"
                  />
                </View>
                {error && (
                  <Text className="mt-1 text-sm text-destructive">{error.message}</Text>
                )}
              </>
            )}
          />
        </View>

        {/* Frequency */}
        <FormSelect
          label="Frequency *"
          name="frequency"
          options={[
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ]}
        />

        {/* Anchor Date */}
        <Controller
          control={control}
          name="anchor_date"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <DatePickerField
              value={value}
              onChange={onChange}
              error={error}
              label="First Billing Date *"
            />
          )}
        />

        {/* Notes */}
        <FormInput
          label="Notes"
          name="notes"
          placeholder="Optional notes about this subscription"
          multiline
          numberOfLines={4}
        />

        {/* Reminder Settings */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">
            Reminder
          </Text>
          <View className="flex-row items-center">
            <Controller
              control={control}
              name="remind_days_before"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <View className={`flex-1 p-3 rounded-lg border mr-2 bg-card border-input ${
                    error ? 'border-destructive' : ''
                  }`}>
                    <TextInput
                      value={value?.toString() || ''}
                      onChangeText={(text) => onChange(parseInt(text) || 0)}
                      keyboardType="number-pad"
                      className="text-card-foreground"
                    />
                  </View>
                  {error && (
                    <Text className="mt-1 text-sm text-destructive">{error.message}</Text>
                  )}
                </>
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
          <Text className="text-center text-primary-foreground font-semibold text-lg">
            Save Subscription
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </View>
    </FormProvider>
  );
}
