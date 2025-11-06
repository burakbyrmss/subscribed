import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSetting } from '@/store/slices/settingsSlice';
import { useTheme } from '@/contexts/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '@/database';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const settings = useAppSelector((state) => state.settings.settings);

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'TRY'];

  const handleExport = async () => {
    try {
      const db = getDatabase();
      // TODO: Export all data from database
      const exportData = {
        subscriptions: [],
        categories: [],
        settings,
        exportedAt: new Date().toISOString(),
      };

      const fileUri = `${FileSystem.documentDirectory}subscribed-backup.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export', 'Backup file saved to: ' + fileUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importData = JSON.parse(fileContent);

      // TODO: Import data to database
      Alert.alert('Success', 'Data imported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to import data');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">
            Settings
          </Text>
        </View>

        {/* Theme */}
        <View className="mb-4 p-4 rounded-lg bg-card">
          <Text className="text-lg font-semibold mb-4 text-card-foreground">
            Appearance
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="flex-row justify-between items-center py-3 border-b border-border">
            <Text className="text-card-foreground">Theme</Text>
            <Text className="font-medium text-primary">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Currency */}
        <View className="mb-4 p-4 rounded-lg bg-card">
          <Text className="text-lg font-semibold mb-4 text-card-foreground">
            Currency
          </Text>
          <View className="flex-row flex-wrap">
            {currencies.map((curr) => (
              <TouchableOpacity
                key={curr}
                onPress={() => dispatch(updateSetting({ key: 'currency_default', value: curr }))}
                className={`mr-2 mb-2 px-4 py-2 rounded-lg ${
                  settings.currency_default === curr
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}>
                <Text
                  className={`font-medium ${
                    settings.currency_default === curr
                      ? 'text-primary-foreground'
                      : 'text-secondary-foreground'
                  }`}>
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* First Day of Week */}
        <View className="mb-4 p-4 rounded-lg bg-card">
          <Text className="text-lg font-semibold mb-4 text-card-foreground">
            First Day of Week
          </Text>
          <View className="flex-row">
            {[
              { value: '0', label: 'Sunday' },
              { value: '1', label: 'Monday' },
            ].map((day) => (
              <TouchableOpacity
                key={day.value}
                onPress={() =>
                  dispatch(updateSetting({ key: 'first_day_of_week', value: day.value }))
                }
                className={`flex-1 py-3 px-4 rounded-lg mr-2 ${
                  settings.first_day_of_week === day.value
                    ? 'bg-primary'
                    : 'bg-secondary'
                }`}>
                <Text
                  className={`text-center font-medium ${
                    settings.first_day_of_week === day.value
                      ? 'text-primary-foreground'
                      : 'text-secondary-foreground'
                  }`}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export/Import */}
        <View className="mb-4 p-4 rounded-lg bg-card">
          <Text className="text-lg font-semibold mb-4 text-card-foreground">
            Backup & Restore
          </Text>
          <TouchableOpacity
            onPress={handleExport}
            className="py-3 mb-3 rounded-lg bg-primary">
            <Text className="text-center text-primary-foreground font-semibold">Export Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleImport}
            className="py-3 rounded-lg border border-border bg-card">
            <Text className="text-center font-semibold text-card-foreground">
              Import Data
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
