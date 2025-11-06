import { configureStore } from '@reduxjs/toolkit';
import subscriptionsReducer from './slices/subscriptionsSlice';
import categoriesReducer from './slices/categoriesSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    subscriptions: subscriptionsReducer,
    categories: categoriesReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

