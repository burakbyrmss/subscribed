import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

interface TimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: { message?: string };
  label?: string;
  compact?: boolean;
}

export function TimePickerField({
  value,
  onChange,
  error,
  label,
  compact,
}: TimePickerFieldProps) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const parseTime = (hhmm: string): Date => {
    const d = new Date();          // ✅ today (current tz/DST rules)
    d.setSeconds(0, 0);
  
    if (!hhmm) {
      d.setHours(9, 0, 0, 0);
      return d;
    }
  
    const [hStr, mStr] = hhmm.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
    return d;
  };
  const [internalDate, setInternalDate] = useState<Date>(() => parseTime(value));

  useEffect(() => {
    setInternalDate(parseTime(value));
  }, [value]);

  const toHHmm = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selectedDate) {
      setInternalDate(selectedDate);
      if (Platform.OS === 'android') {
        onChange(toHHmm(selectedDate));
      }
    } else if (event.type === 'dismissed') setShow(false);
  };

  const handleDone = () => {
    onChange(toHHmm(internalDate));
    setShow(false);
  };

  const formatTime = (hhmm: string): string => {
    const [hStr, mStr] = (hhmm || '09:00').split(':');
    const h = Math.min(23, Math.max(0, Number(hStr)));
    const m = Math.min(59, Math.max(0, Number(mStr)));
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Number.isFinite(h) ? h : 9)}:${pad(Number.isFinite(m) ? m : 0)}`;
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
            <Modal
              transparent
              animationType="fade"
              visible={show}
              onRequestClose={() => setShow(false)}>
              <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-card rounded-lg p-4 w-[90%] max-w-sm">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-semibold text-card-foreground">{label || t('common.time')}</Text>
                    <TouchableOpacity onPress={handleDone}>
                      <Text className="text-primary font-medium">{t('common.done')}</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={internalDate}
                    mode="time"
                    display="spinner"
                    onChange={handleChange}
                    is24Hour={true}
                    style={{ backgroundColor: 'transparent' }}
                  />
                </View>
              </View>
            </Modal>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker 
              value={internalDate} 
              mode="time" 
              display="default" 
              onChange={handleChange}
              is24Hour={true}
            />
          )}
        </>
      )}
    </View>
  );
}
