import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

export interface FormDatePickerProps {
  label: string;
  name: string;
  mode?: 'date' | 'time' | 'datetime';
  containerClassName?: string;
  pickerClassName?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

interface DatePickerInnerProps {
  value: Date | string | null | undefined;
  onChange: (date: Date) => void;
  error?: { message?: string };
  label: string;
  mode: 'date' | 'time' | 'datetime';
  containerClassName: string;
  pickerClassName: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function DatePickerInner({
  value,
  onChange,
  error,
  label,
  mode,
  containerClassName,
  pickerClassName,
  minimumDate,
  maximumDate,
}: DatePickerInnerProps) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [internalDate, setInternalDate] = useState<Date>(() => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return new Date();
  });

  useEffect(() => {
    if (value) {
      const dateValue = value instanceof Date ? value : new Date(String(value));
      setInternalDate(dateValue);
    }
  }, [value]);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (event.type === 'set' && selectedDate) {
      setInternalDate(selectedDate);
      onChange(selectedDate);
      if (Platform.OS === 'ios') {
        setShow(false);
      }
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(String(date));
    if (mode === 'time') {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (mode === 'datetime') {
      return dateObj.toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return dateObj.toLocaleDateString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const displayValue = value
    ? formatDate(value instanceof Date ? value : String(value))
    : t('common.selectDate');

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="mb-2 font-medium text-foreground">{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className={`p-3 rounded-lg border bg-card border-input ${
          error ? 'border-destructive' : ''
        } ${pickerClassName}`}>
        <Text className="text-card-foreground">{displayValue}</Text>
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
                    <Text className="text-primary font-medium">{t('common.done')}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={internalDate}
                  mode={mode}
                  display="spinner"
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  style={{ backgroundColor: 'transparent' }}
                />
              </View>
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={internalDate}
              mode={mode}
              display="default"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}
        </>
      )}
    </View>
  );
}

export function FormDatePicker({
  label,
  name,
  mode = 'date',
  containerClassName = '',
  pickerClassName = '',
  minimumDate,
  maximumDate,
}: FormDatePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DatePickerInner
          value={value}
          onChange={onChange}
          error={error}
          label={label}
          mode={mode}
          containerClassName={containerClassName}
          pickerClassName={pickerClassName}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    />
  );
}
