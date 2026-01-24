import { useTheme } from '@/contexts/ThemeContext';
import { getAllCategories, getAllSettings, getAllSubscriptions, getCurrentDateTime, resetDatabase, saveCategory, saveSetting, saveSubscription } from '@/database';
import { Category, Setting, SettingKey, Subscription } from '@/types/database';
import { scheduleTestNotification } from '@/utils/notifications';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<Record<SettingKey, string>>({
    currency_default: 'USD',
    first_day_of_week: '1',
    locale: 'en-US',
    theme: 'dark',
    backup_hint_dismissed: 'false',
  });

  const loadSettings = useCallback(async () => {
    const settingsData = await getAllSettings();
    const settingsRecord = settingsData.reduce((acc, setting) => {
      acc[setting.key as SettingKey] = setting.value;
      return acc;
    }, {} as Record<SettingKey, string>);
    setSettings((prev) => ({ ...prev, ...settingsRecord }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

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

  // Helper function to escape CSV values
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // If value contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Helper function to convert array of objects to CSV
  const arrayToCsv = (data: any[], headers: string[]): string => {
    const rows = [headers.join(',')];
    for (const item of data) {
      const row = headers.map(header => escapeCsvValue(item[header]));
      rows.push(row.join(','));
    }
    return rows.join('\n');
  };

  const handleExport = async () => {
    try {
      // Export all data from database
      const [subscriptions, categories, dbSettings] = await Promise.all([
        getAllSubscriptions(),
        getAllCategories(),
        getAllSettings(),
      ]);
      
      // Create CSV sections
      const csvSections: string[] = [];
      
      // Export subscriptions
      if (subscriptions.length > 0) {
        csvSections.push('# SUBSCRIPTIONS');
        csvSections.push(arrayToCsv(subscriptions, [
          'id', 'name', 'notes', 'price_minor', 'currency', 'frequency', 
          'interval', 'anchor_date', 'by_month_day', 'notify_me', 'remind_days_before', 
          'remind_time', 'category_id', 'tags', 'status', 'created_at', 'updated_at'
        ]));
        csvSections.push('');
      }
      
      // Export categories
      if (categories.length > 0) {
        csvSections.push('# CATEGORIES');
        csvSections.push(arrayToCsv(categories, [
          'id', 'name', 'icon', 'color', 'created_at', 'updated_at'
        ]));
        csvSections.push('');
      }
      
      // Export settings
      if (dbSettings.length > 0) {
        csvSections.push('# SETTINGS');
        csvSections.push(arrayToCsv(dbSettings, ['key', 'value', 'updated_at']));
        csvSections.push('');
      }
      
      // Add metadata
      csvSections.push(`# EXPORTED_AT,${new Date().toISOString()}`);

      const csvContent = csvSections.join('\n');

      // Create file - use documentDirectory if available, otherwise use a simple filename
      const fileName = 'subscribed-backup.csv';
      // cacheDirectory exists at runtime but types may be outdated
      const cacheDir = (FileSystem as any).cacheDirectory;
      const fileUri = cacheDir ? `${cacheDir}${fileName}` : fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export', 'Backup file saved to: ' + fileUri);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // Helper function to parse CSV value (handles quoted values)
  const parseCsvValue = (value: string): string => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  };

  // Helper function to parse CSV line
  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Add last value
    return values;
  };

  // Helper function to convert CSV to array of objects
  const csvToArray = (csvContent: string, headers: string[]): any[] => {
    const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    if (lines.length === 0) return [];
    
    // Skip the header row (first line)
    const dataLines = lines.slice(1);
    
    const data: any[] = [];
    for (let i = 0; i < dataLines.length; i++) {
      const values = parseCsvLine(dataLines[i]);
      if (values.length === headers.length) {
        const obj: any = {};
        headers.forEach((header, index) => {
          const value = parseCsvValue(values[index] || '').trim();
          // Convert empty strings to null for nullable fields
          obj[header] = value === '' ? null : value;
        });
        data.push(obj);
      }
    }
    return data;
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accept all file types, user should select CSV file
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const lines = fileContent.split('\n');
      
      let currentSection = '';
      let sectionContent: string[] = [];
      const sections: Record<string, string> = {};
      
      // Parse CSV sections
      for (const line of lines) {
        if (line.startsWith('# ')) {
          // Save previous section
          if (currentSection && sectionContent.length > 0) {
            sections[currentSection] = sectionContent.join('\n');
          }
          // Start new section
          currentSection = line.substring(2).trim();
          sectionContent = [];
        } else if (line.trim() && currentSection) {
          sectionContent.push(line);
        }
      }
      // Save last section
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection] = sectionContent.join('\n');
      }
      
      // Import subscriptions
      if (sections['SUBSCRIPTIONS']) {
        const subscriptionHeaders = [
          'id', 'name', 'notes', 'price_minor', 'currency', 'frequency',
          'interval', 'anchor_date', 'by_month_day', 'notify_me', 'remind_days_before',
          'remind_time', 'category_id', 'tags', 'status', 'created_at', 'updated_at',
        ];
        // Support legacy CSV without notify_me (16 cols)
        const legacyHeaders = [
          'id', 'name', 'notes', 'price_minor', 'currency', 'frequency',
          'interval', 'anchor_date', 'by_month_day', 'remind_days_before',
          'remind_time', 'category_id', 'tags', 'status', 'created_at', 'updated_at',
        ];
        let subscriptions = csvToArray(sections['SUBSCRIPTIONS'], subscriptionHeaders);
        if (subscriptions.length === 0) {
          subscriptions = csvToArray(sections['SUBSCRIPTIONS'], legacyHeaders);
        }
        // Import subscriptions to database
        for (const sub of subscriptions) {
          const subscription: Subscription = {
            ...sub,
            price_minor: parseInt(sub.price_minor, 10),
            interval: parseInt(sub.interval, 10),
            notify_me: sub.notify_me === 'false' ? false : true,
            remind_days_before: parseInt(sub.remind_days_before, 10),
            by_month_day: sub.by_month_day ? parseInt(sub.by_month_day, 10) : null,
          };
          await saveSubscription(subscription);
        }
      }
      
      // Import categories
      if (sections['CATEGORIES']) {
        const categories = csvToArray(sections['CATEGORIES'], [
          'id', 'name', 'icon', 'color', 'created_at', 'updated_at'
        ]);
        
        // Import categories to database
        for (const cat of categories) {
          const category: Category = cat;
          await saveCategory(category);
        }
      }
      
      // Import settings
      if (sections['SETTINGS']) {
        const settings = csvToArray(sections['SETTINGS'], ['key', 'value', 'updated_at']);
        
        // Import settings to database
        for (const setting of settings) {
          const dbSetting: Setting = setting;
          await saveSetting(dbSetting);
        }
        
        // Reload settings in UI
        const settingsData = await getAllSettings();
        const settingsRecord = settingsData.reduce((acc, setting) => {
          acc[setting.key as SettingKey] = setting.value;
          return acc;
        }, {} as Record<SettingKey, string>);
        setSettings((prev) => ({ ...prev, ...settingsRecord }));
      }
      
      Alert.alert('Success', 'Data imported successfully');
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import data. Please check the CSV format.');
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
                first_day_of_week: '1',
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

        {/* Development */}
        <View className="mb-8 p-4 rounded-lg bg-card border border-destructive/20">
          <Text className="text-lg font-semibold mb-2 text-card-foreground">
            Development
          </Text>
          <Text className="text-sm mb-4 text-muted-foreground">
            Test notifications and reset data. For development only.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission required', 'Enable notifications in Settings to receive test notifications.');
                  return;
                }
                await scheduleTestNotification();
                Alert.alert('Test notification', 'A test notification was sent. Check your device.');
              } catch (e) {
                Alert.alert('Error', 'Failed to send test notification. Ensure notification permissions are granted.');
              }
            }}
            className="py-3 mb-3 rounded-lg border border-border bg-card">
            <Text className="text-center font-semibold text-card-foreground">
              Send test notification
            </Text>
          </TouchableOpacity>
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
