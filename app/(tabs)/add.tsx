import { FormInput, FormSelect } from '@/components/form';
import { generateUUID, getAllSettings, getCurrentDateTime, saveSubscription } from '@/database';
import { SubscriptionFormData, subscriptionSchema } from '@/schemas/subscription';
import { Subscription } from '@/types/database';
import { calculateNextOccurrence, formatDate } from '@/utils/date';
import { scheduleNotificationsForSubscription } from '@/utils/notifications';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, FormProvider, Resolver, SubmitHandler, useForm } from 'react-hook-form';
import { Alert, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

// Time Picker for HH:mm string (e.g. remind_time)
function TimePickerField({
  value,
  onChange,
  error,
  label,
  compact,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: { message?: string };
  label?: string;
  compact?: boolean;
}) {
  const [show, setShow] = useState(false);
  const parseTime = (hhmm: string): Date => {
    if (!hhmm) return new Date(2000, 0, 1, 9, 0);
    const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
    return new Date(2000, 0, 1, h || 9, m || 0);
  };
  const [internalDate, setInternalDate] = useState<Date>(() => parseTime(value));

  useEffect(() => {
    setInternalDate(parseTime(value));
  }, [value]);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selectedDate) {
      setInternalDate(selectedDate);
      onChange(dayjs(selectedDate).format('HH:mm'));
      if (Platform.OS === 'ios') setShow(false);
    } else if (event.type === 'dismissed') setShow(false);
  };

  const formatTime = (hhmm: string): string => {
    if (!hhmm) return '09:00';
    return dayjs(`2000-01-01T${hhmm}`).format('h:mm A');
  };

  return (
    <View className={compact ? '' : 'mb-4'}>
      {label ? <Text className="mb-2 font-medium text-foreground">{label}</Text> : null}
      <TouchableOpacity
        onPress={() => setShow(true)}
        className={`rounded-lg border bg-card border-input p-3 ${error ? 'border-destructive' : ''} ${compact ? 'min-w-[100px]' : ''}`}>
        <Text className="text-card-foreground">{formatTime(value)}</Text>
      </TouchableOpacity>
      {error && <Text className="mt-1 text-sm text-destructive">{error.message}</Text>}
      {show && (
        <>
          {Platform.OS === 'ios' && (
            <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
              <View className="bg-card rounded-lg p-4 w-[90%] max-w-sm">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-semibold text-card-foreground">{label || 'Time'}</Text>
                  <TouchableOpacity onPress={() => setShow(false)}>
                    <Text className="text-primary font-medium">Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={internalDate}
                  mode="time"
                  display="spinner"
                  onChange={handleChange}
                  style={{ backgroundColor: 'transparent' }}
                />
              </View>
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker value={internalDate} mode="time" display="default" onChange={handleChange} />
          )}
        </>
      )}
    </View>
  );
}

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const [currencyDefault, setCurrencyDefault] = useState<string>('USD');
  const isFirstMount = useRef(true);

  // Load settings when screen comes into focus (including when navigating back to this tab)
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        const settings = await getAllSettings();
        const currencySetting = settings.find((s) => s.key === 'currency_default');
        if (currencySetting) {
          setCurrencyDefault(currencySetting.value);
        }
      };
      loadSettings();
    }, [])
  );

  const getDefaultValues = useCallback(() => ({
    name: '',
    notes: null,
    price_minor: 0,
    currency: currencyDefault || 'USD',
    frequency: 'monthly' as const,
    interval: 1,
    anchor_date: dayjs().format('YYYY-MM-DD'),
    by_month_day: null,
    notify_me: true,
    remind_days_before: 2,
    remind_time: '09:00',
    category_id: null,
    tags: null,
    status: 'active' as const,
  }), [currencyDefault]);

  const formMethods = useForm<SubscriptionFormData, any, SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema) as Resolver<SubscriptionFormData, any, SubscriptionFormData>,
    defaultValues: getDefaultValues(),
  });

  const { setValue, reset } = formMethods;

  // Reset form when currency default changes
  useEffect(() => {
    if (currencyDefault && !isFirstMount.current) {
      setValue('currency', currencyDefault);
    }
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }
  }, [currencyDefault, setValue]);

  // Reset form when screen loses focus (navigating away)
  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus, reset form if it wasn't just mounted
      return () => {
        // Cleanup: Reset form when screen loses focus
        if (!isFirstMount.current) {
          reset(getDefaultValues());
        }
      };
    }, [reset, getDefaultValues])
  );

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

      // Save to database
      await saveSubscription(subscription);

      // Schedule notifications based on notify_me, remind_days_before, and remind_time
      await scheduleNotificationsForSubscription(subscription);

      // Reset form before navigating away
      reset(getDefaultValues());
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
            Price ({currencyDefault}) *
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

        {/* Notify me & Remind me */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">Notifications</Text>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-foreground">Notify me</Text>
            <Controller
              control={control}
              name="notify_me"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: '#d1d5db', true: '#34d399' }}
                  thumbColor="#fff"
                />
              )}
            />
          </View>
          <View>
            <Text className="mb-2 font-medium text-foreground">Remind me</Text>
            <View className="flex-row flex-wrap items-center gap-2">
              <Controller
                control={control}
                name="remind_days_before"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View className="flex-row items-center">
                    <View
                      className={`w-16 p-3 rounded-lg border bg-card border-input ${
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
                      <Text className="ml-2 text-sm text-destructive">{error.message}</Text>
                    )}
                  </View>
                )}
              />
              <Text className="text-foreground">days before at</Text>
              <Controller
                control={control}
                name="remind_time"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <TimePickerField
                    value={value}
                    onChange={onChange}
                    error={error}
                    compact
                  />
                )}
              />
            </View>
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
