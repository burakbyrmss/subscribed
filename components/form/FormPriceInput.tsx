import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TextInputProps, View } from 'react-native';

/** Locales that use comma as decimal separator. */
const COMMA_DECIMAL_LOCALES = new Set([
  'tr', 'de', 'fr', 'it', 'es', 'pt', 'ru', 'pl', 'nl', 'el', 'sv', 'da', 'no', 'fi', 'hu', 'ro', 'cs', 'sk', 'bg', 'hr', 'sl',
]);

function getDecimalSeparator(locale: string): string {
  const code = locale.split('-')[0].toLowerCase();
  return COMMA_DECIMAL_LOCALES.has(code) ? ',' : '.';
}

/** Parse decimal-pad input to minor units; accepts both comma and dot. */
function parsePriceInput(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(',', '.');
  const num = parseFloat(normalized);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

/** Validate that the displayed string uses the locale decimal separator (for schema/refine). */
export function isValidPriceFormatForLocale(text: string, locale: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  const sep = getDecimalSeparator(locale);
  if (sep === ',') return !trimmed.includes('.');
  return !trimmed.includes(',');
}

export interface FormPriceInputProps extends Omit<TextInputProps, 'className' | 'value' | 'onChangeText'> {
  label: string;
  name: string;
  containerClassName?: string;
  inputClassName?: string;
}

export function FormPriceInput({
  label,
  name,
  containerClassName = '',
  inputClassName = '',
  ...textInputProps
}: FormPriceInputProps) {
  const { control, setError, clearErrors, watch } = useFormContext();
  const value = watch(name) as number | undefined;
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const placeholderTextColor = theme === 'dark' ? '#9BA1A6' : '#687076';

  const [displayStr, setDisplayStr] = React.useState('');
  const prevValueRef = React.useRef<number | null>(null);

  // Sync display with form: clear when form resets; show value when set from outside (e.g. edit)
  React.useEffect(() => {
    const num = value ?? 0;
    if (num === 0 && prevValueRef.current !== null && prevValueRef.current !== 0) {
      setDisplayStr('');
    } else if (num !== 0 && displayStr === '') {
      setDisplayStr((num / 100).toString());
    }
    prevValueRef.current = num;
  }, [value, displayStr]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange }, fieldState: { error } }) => (
        <View className={`mb-4 ${containerClassName}`}>
          <Text className="mb-2 font-medium text-foreground">{label}</Text>
          <TextInput
            {...textInputProps}
            value={displayStr}
            onChangeText={setDisplayStr}
            onBlur={() => {
              const text = displayStr.trim();
              if (!text) {
                onChange(0);
                return;
              }
              if (!isValidPriceFormatForLocale(displayStr, locale)) {
                const sep = getDecimalSeparator(locale);
                setError(name, {
                  type: 'manual',
                  message: sep === ',' ? t('add.form.priceUseComma') : t('add.form.priceUsePeriod'),
                });
                return;
              }
              clearErrors(name);
              onChange(parsePriceInput(displayStr));
            }}
            placeholderTextColor={placeholderTextColor}
            className={`p-3 rounded-lg border bg-card border-input text-card-foreground ${
              error ? 'border-destructive' : ''
            } ${inputClassName}`}
          />
          {error && (
            <Text className="mt-1 text-sm text-destructive">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}
