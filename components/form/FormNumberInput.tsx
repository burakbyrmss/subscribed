import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Text, TextInput, TextInputProps, View } from 'react-native';

export interface FormNumberInputProps extends Omit<TextInputProps, 'className' | 'value' | 'onChangeText'> {
  label: string;
  name: string;
  containerClassName?: string;
  inputClassName?: string;
}

export function FormNumberInput({
  label,
  name,
  containerClassName = '',
  inputClassName = '',
  ...textInputProps
}: FormNumberInputProps) {
  const { control } = useFormContext();
  const { theme } = useTheme();
  const placeholderTextColor = theme === 'dark' ? '#9BA1A6' : '#687076';

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View className={`mb-4 ${containerClassName}`}>
          {label ? <Text className="mb-2 font-medium text-foreground">{label}</Text> : null}
          <TextInput
            {...textInputProps}
            value={value?.toString() || ''}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              onChange(num);
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
