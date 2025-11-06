import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Subscription, SubscriptionStatus } from '@/types/database';

interface SubscriptionsState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionsState = {
  subscriptions: [],
  loading: false,
  error: null,
};

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    setSubscriptions: (state, action: PayloadAction<Subscription[]>) => {
      state.subscriptions = action.payload;
    },
    addSubscription: (state, action: PayloadAction<Subscription>) => {
      state.subscriptions.push(action.payload);
    },
    updateSubscription: (state, action: PayloadAction<Subscription>) => {
      const index = state.subscriptions.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.subscriptions[index] = action.payload;
      }
    },
    deleteSubscription: (state, action: PayloadAction<string>) => {
      state.subscriptions = state.subscriptions.filter((s) => s.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  setLoading,
  setError,
} = subscriptionsSlice.actions;

export default subscriptionsSlice.reducer;

