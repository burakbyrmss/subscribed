import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingKey } from '@/types/database';

interface SettingsState {
  settings: Record<SettingKey, string>;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {
    currency_default: 'USD',
    first_day_of_week: '0', // 0 = Sunday, 1 = Monday
    locale: 'en-US',
    theme: 'dark',
    backup_hint_dismissed: 'false',
  },
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Record<SettingKey, string>>) => {
      state.settings = action.payload;
    },
    updateSetting: (state, action: PayloadAction<{ key: SettingKey; value: string }>) => {
      state.settings[action.payload.key] = action.payload.value;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setSettings, updateSetting, setLoading, setError } = settingsSlice.actions;

export default settingsSlice.reducer;

