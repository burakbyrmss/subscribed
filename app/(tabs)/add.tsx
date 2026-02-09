import { FormDatePicker, FormInput, FormNumberInput, FormPriceInput, FormSelect, FormSwitch, FormTimePicker } from '@/components/form';
import { generateUUID, getAllSettings, getCurrentDateTime, saveSubscription } from '@/database';
import { SubscriptionFormData, subscriptionSchema } from '@/schemas/subscription';
import { Subscription } from '@/types/database';
import { calculateNextOccurrence, formatDate } from '@/utils/date';
import { scheduleNotificationsForSubscription } from '@/utils/notifications';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, Resolver, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddSubscriptionScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  const { handleSubmit, watch } = formMethods;

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
      console.log('data', data);
      const subscription: Subscription = {
        id: generateUUID(),
        ...data,
        created_at: getCurrentDateTime(),
        updated_at: getCurrentDateTime(),
      };

      // Save to database
      await saveSubscription(subscription);
      console.log('subscription saved', subscription);
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
        <View className="pb-4 px-4 bg-card" style={{ paddingTop: insets.top }}>
          <Text className="text-3xl font-bold text-card-foreground">
            {t('add.title')}
          </Text>
        </View>
        <ScrollView className="flex-1 px-4">
        {/* Name */}
        <FormInput
          label={`${t('add.form.name')} *`}
          name="name"
          placeholder={t('add.form.namePlaceholder')}
        />

        {/* Price */}
        <FormPriceInput
          label={`${t('subscription.price')} (${currencyDefault}) *`}
          name="price_minor"
          keyboardType="decimal-pad"
          placeholder={t('add.form.pricePlaceholder')}
        />

        {/* Frequency */}
        <FormSelect
          label={`${t('subscription.frequency')} *`}
          name="frequency"
          options={[
            { label: t('subscription.frequencies.weekly'), value: 'weekly' },
            { label: t('subscription.frequencies.monthly'), value: 'monthly' },
            { label: t('subscription.frequencies.yearly'), value: 'yearly' },
          ]}
        />

        {/* Anchor Date */}
        <FormDatePicker
          label={`${t('subscription.anchorDate')} *`}
          name="anchor_date"
        />

        {/* Notes */}
        <FormInput
          label={t('subscription.notes')}
          name="notes"
          placeholder={t('add.form.notesPlaceholder')}
          multiline
          numberOfLines={4}
        />

        {/* Notify me & Remind me */}
        <View className="mb-4">
          <Text className="mb-2 font-medium text-foreground">{t('add.form.notifications')}</Text>
          <FormSwitch
            label={t('add.form.notifyMe')}
            name="notify_me"
            trackColor={{ false: '#d1d5db', true: '#34d399' }}
            thumbColor="#fff"
            containerClassName="mb-0"
          />
          <View>
            <Text className="mb-2 font-medium text-foreground">{t('add.form.remindMe')}</Text>
            <View className="flex-row flex-wrap items-center gap-2">
              <FormNumberInput
                label=""
                name="remind_days_before"
                keyboardType="number-pad"
                containerClassName="mb-0"
                inputClassName="w-16"
              />
              <Text className="text-foreground">{t('add.form.daysBeforeAt')}</Text>
              <FormTimePicker
                name="remind_time"
                compact
                containerClassName="mb-0"
              />
            </View>
          </View>
        </View>

        {/* Next Occurrences Preview */}
        {nextOccurrences.length > 0 && (
          <View className="mb-4 p-4 rounded-lg bg-card">
            <Text className="mb-2 font-semibold text-card-foreground">
              {t('add.form.summary')}:
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
            {t('add.form.submit')}
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </View>
    </FormProvider>
  );
}
