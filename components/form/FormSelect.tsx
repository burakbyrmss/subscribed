import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';

export interface FormSelectOption {
  label: string;
  value: string | number;
}

export interface FormSelectProps {
  label: string;
  name: string;
  options: FormSelectOption[];
  placeholder?: string;
  containerClassName?: string;
  selectClassName?: string;
}

export function FormSelect({
  label,
  name,
  options,
  placeholder = 'Select an option',
  containerClassName = '',
  selectClassName = '',
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedOption = options.find((opt) => opt.value === value);

        return (
          <View className={`mb-4 ${containerClassName}`}>
            <Text className="mb-2 font-medium text-foreground">{label}</Text>
            <TouchableOpacity
              onPress={() => setIsOpen(true)}
              className={`p-3 rounded-lg border bg-card border-input ${
                error ? 'border-destructive' : ''
              } ${selectClassName}`}>
              <Text
                className={`${
                  selectedOption ? 'text-card-foreground' : 'text-muted-foreground'
                }`}>
                {selectedOption ? selectedOption.label : placeholder}
              </Text>
            </TouchableOpacity>
            {error && (
              <Text className="mt-1 text-sm text-destructive">{error.message}</Text>
            )}

            <Modal
              visible={isOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setIsOpen(false)}>
              <TouchableOpacity
                className="flex-1 bg-black/50 justify-end"
                activeOpacity={1}
                onPress={() => setIsOpen(false)}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  className="bg-card rounded-t-3xl p-4 max-h-[80%]">
                  <View className="mb-4">
                    <Text className="text-lg font-semibold text-card-foreground">
                      {label}
                    </Text>
                  </View>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={String(option.value)}
                      onPress={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`py-4 px-3 rounded-lg mb-2 ${
                        value === option.value
                          ? 'bg-primary'
                          : 'bg-secondary'
                      }`}>
                      <Text
                        className={`font-medium ${
                          value === option.value
                            ? 'text-primary-foreground'
                            : 'text-card-foreground'
                        }`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    className="mt-4 py-3 px-4 rounded-lg bg-secondary">
                    <Text className="text-center font-medium text-card-foreground">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </View>
        );
      }}
    />
  );
}

