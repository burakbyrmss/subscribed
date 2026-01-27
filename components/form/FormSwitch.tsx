import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Switch, SwitchProps, Text, View } from 'react-native';

export interface FormSwitchProps extends Omit<SwitchProps, 'value' | 'onValueChange'> {
  label: string;
  name: string;
  containerClassName?: string;
  showLabel?: boolean;
}

export function FormSwitch({
  label,
  name,
  containerClassName = '',
  showLabel = true,
  ...switchProps
}: FormSwitchProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View className={`mb-4 ${containerClassName}`}>
          {showLabel && (
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-foreground">{label}</Text>
              <Switch
                {...switchProps}
                value={value}
                onValueChange={onChange}
              />
            </View>
          )}
          {!showLabel && (
            <Switch
              {...switchProps}
              value={value}
              onValueChange={onChange}
            />
          )}
          {error && (
            <Text className="mt-1 text-sm text-destructive">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}
