import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: { message?: string };
  label: string;
}

export function DatePickerField({
  value,
  onChange,
  error,
  label,
}: DatePickerFieldProps) {
  const { t } = useTranslation();
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
      if (Platform.OS === 'android') {
        onChange(dayjs(selectedDate).format('YYYY-MM-DD'));
      }
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  const handleDone = () => {
    onChange(dayjs(internalDate).format('YYYY-MM-DD'));
    setShow(false);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'YYYY-MM-DD';
    // Use year/month/date to avoid timezone shifts when parsing YYYY-MM-DD strings
    const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
    return dayjs().year(y).month(m - 1).date(d).format('YYYY-MM-DD');
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
            <Modal
              transparent
              animationType="fade"
              visible={show}
              onRequestClose={() => setShow(false)}>
              <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-card rounded-lg p-4 w-[90%] max-w-sm">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-semibold text-card-foreground">
                      {label}
                    </Text>
                    <TouchableOpacity onPress={handleDone}>
                      <Text className="text-primary font-medium">{t('common.done')}</Text>
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
            </Modal>
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
