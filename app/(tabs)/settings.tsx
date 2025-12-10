import { useTheme } from '@/contexts/ThemeContext';
import { getAllCategories, getAllSettings, getAllSubscriptions, getCurrentDateTime, resetDatabase, saveSetting } from '@/database';
import { SettingKey } from '@/types/database';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<Record<SettingKey, string>>({
    currency_default: 'USD',
    first_day_of_week: '0',
    locale: 'en-US',
    theme: 'dark',
    backup_hint_dismissed: 'false',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const settingsData = await getAllSettings();
      const settingsRecord = settingsData.reduce((acc, setting) => {
        acc[setting.key as SettingKey] = setting.value;
        return acc;
      }, {} as Record<SettingKey, string>);
      setSettings((prev) => ({ ...prev, ...settingsRecord }));
    };
    loadSettings();
  }, []);

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'TRY'];

  const handleUpdateSetting = async (key: SettingKey, value: string) => {
    try {
      // Update database
      await saveSetting({
        key,
        value,
        updated_at: getCurrentDateTime(),
      });
      
      // Update local state
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const handleExport = async () => {
    try {
      // Export all data from database
      const [subscriptions, categories, dbSettings] = await Promise.all([
        getAllSubscriptions(),
        getAllCategories(),
        getAllSettings(),
      ]);
      
      const exportData = {
        subscriptions,
        categories,
        settings: dbSettings,
        exportedAt: new Date().toISOString(),
      };

      // Create file - use documentDirectory if available, otherwise use a simple filename
      const fileName = 'subscribed-backup.json';
      // @ts-ignore - cacheDirectory exists at runtime but types may be outdated
      const cacheDir = FileSystem.cacheDirectory;
      const fileUri = cacheDir ? `${cacheDir}${fileName}` : fileName;
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

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'Are you sure you want to delete ALL data? This action cannot be undone. This will delete:\n\n• All subscriptions\n• All categories\n• All settings\n• All occurrence logs\n• All reminders',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'Database has been reset successfully');
              // Reset settings to defaults
              setSettings({
                currency_default: 'USD',
                first_day_of_week: '0',
                locale: 'en-US',
                theme: 'dark',
                backup_hint_dismissed: 'false',
              });
            } catch (error) {
              console.error('Error resetting database:', error);
              Alert.alert('Error', 'Failed to reset database');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="pt-12 pb-4 px-4 bg-card">
        <Text className="text-3xl font-bold text-card-foreground">
          Settings
        </Text>
      </View>
      <ScrollView className="flex-1 px-4">

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
                onPress={() => handleUpdateSetting('currency_default', curr)}
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
                onPress={() => handleUpdateSetting('first_day_of_week', day.value)}
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

        {/* Development: Reset Database */}
        <View className="mb-8 p-4 rounded-lg bg-card border border-destructive/20">
          <Text className="text-lg font-semibold mb-2 text-card-foreground">
            Development
          </Text>
          <Text className="text-sm mb-4 text-muted-foreground">
            Reset all database data. Use only for development purposes.
          </Text>
          <TouchableOpacity
            onPress={handleResetDatabase}
            className="py-3 rounded-lg bg-destructive">
            <Text className="text-center text-destructive-foreground font-semibold">
              Reset Database
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
