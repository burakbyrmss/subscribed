import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Text, TextInput, TextInputProps, View } from 'react-native';

export interface FormInputProps extends Omit<TextInputProps, 'className' | 'value' | 'onChangeText'> {
  label: string;
  name: string;
  containerClassName?: string;
  inputClassName?: string;
}

export function FormInput({
  label,
  name,
  containerClassName = '',
  inputClassName = '',
  ...textInputProps
}: FormInputProps) {
  const { control } = useFormContext();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
            onChangeText={onChange}
            placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
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

