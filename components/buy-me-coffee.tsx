import { formatCurrency } from '@/utils/date';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as IAP from 'react-native-iap';
import { isUserCancelledError } from 'react-native-iap';

// Platform-specific product IDs
const PRODUCT_IDS = Platform.select({
  ios: {
    small: 'subsNoteCoffeeSmall2',
    medium: 'subsNoteCoffeeMid2',
    large: 'subsNoteCoffeeLarge2',
  },
  android: {
    small:  'subsnote_coffee_small_1',
    medium: 'subsnote_coffee_medium_1',
    large:  'subsnote_coffee_large_1',
  },
})!;

// Prices by locale: TR = 50/150/300 TRY, default = 1/5/10 USD (amount in major units)
const PRICES_BY_LOCALE: Record<string, { small: number; medium: number; large: number; currency: string }> = {
  tr: { small: 49.99, medium: 249.99, large: 499.99, currency: 'TRY' },
  default: { small: 0.99, medium: 4.99, large: 9.99, currency: 'USD' },
};

function getPrices(locale: string) {
  return PRICES_BY_LOCALE[locale] ?? PRICES_BY_LOCALE.default;
}

function formatPrice(amount: number, currency: string): string {
  const amountMinor = Math.round(amount * 100);
  return formatCurrency(amountMinor, currency);
}

interface BuyMeCoffeeProps {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
}

export function BuyMeCoffee({ visible, onClose, onDismiss }: BuyMeCoffeeProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = React.useState<string | null>(null);
  const prices = getPrices(i18n.language);

  const handlePurchase = async (productId: keyof typeof PRODUCT_IDS) => {
    try {
      setLoading(productId);
      
      // Initialize IAP connection
      await IAP.initConnection().then(() => {
        console.log('IAP initialized');
      }).catch((error) => {
        console.error('IAP initialization error', error);
      });
      
      const sku = PRODUCT_IDS[productId];

      // Fetch available products
      const products = await IAP.fetchProducts({ skus: [sku], type: 'in-app' });
      console.log('products', products);
      if (!products || products.length === 0) {
        Alert.alert(t('buyMeCoffee.error'), t('buyMeCoffee.productNotFound'));
        setLoading(null);
        return;
      }

      // Request purchase (event-based - result comes via listeners)
      await IAP.requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku] },
        },
        type: 'in-app',
      });
    } catch (error: unknown) {
      if (!isUserCancelledError(error)) {
        const message = error instanceof Error ? error.message : t('buyMeCoffee.purchaseFailed');
        Alert.alert(t('buyMeCoffee.error'), message);
      }
    } finally {
      setLoading(null);
    }
  };

  React.useEffect(() => {
    if (visible) {
      // Initialize IAP when modal opens
      IAP.initConnection().catch(console.error);
    }
    
    // Listen for purchase updates
    const purchaseUpdateSubscription = IAP.purchaseUpdatedListener((purchase) => {
      // Handle successful purchase - finish transaction (consumable product)
      IAP.finishTransaction({ purchase, isConsumable: true }).catch(console.error);
      const productKey = (Object.entries(PRODUCT_IDS) as [keyof typeof PRODUCT_IDS, string][]).find(
        ([, v]) => v === purchase.productId,
      )?.[0];
      if (productKey) {
        const prices = getPrices(i18n.language);
        const amountFormatted = formatPrice(
          prices[productKey] as number,
          prices.currency,
        );
        Alert.alert(
          t('buyMeCoffee.success'),
          t('buyMeCoffee.thankYou', { amount: amountFormatted }),
        );
        onClose();
      }
      setLoading(null);
    });

    const purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
      if (isUserCancelledError(error)) {
        Alert.alert(t('buyMeCoffee.error'), t('buyMeCoffee.productNotFound'));
      } else {
        Alert.alert(t('buyMeCoffee.error'), error.message || t('buyMeCoffee.purchaseFailed'));
      }
      setLoading(null);
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, [visible, t, i18n.language, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/50 justify-center items-center px-4">
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-card rounded-lg p-6 w-full max-w-sm">
          <Text className="text-2xl font-bold mb-2 text-center text-card-foreground">
            ☕ {t('buyMeCoffee.title')}
          </Text>
          <Text className="text-sm mb-6 text-center text-muted-foreground">
            {t('buyMeCoffee.description')}
          </Text>

          <View className="gap-3">
            <TouchableOpacity
              onPress={() => handlePurchase('small')}
              disabled={loading !== null}
              className={`py-4 px-4 rounded-lg border-2 ${
                loading === 'small'
                  ? 'bg-muted border-muted'
                  : 'bg-card border-primary'
              }`}>
              <Text className="text-center font-semibold text-lg text-card-foreground">
                {t('buyMeCoffee.small')} - {formatPrice(prices.small, prices.currency)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePurchase('medium')}
              disabled={loading !== null}
              className={`py-4 px-4 rounded-lg border-2 ${
                loading === 'medium'
                  ? 'bg-muted border-muted'
                  : 'bg-card border-primary'
              }`}>
              <Text className="text-center font-semibold text-lg text-card-foreground">
                {t('buyMeCoffee.medium')} - {formatPrice(prices.medium, prices.currency)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePurchase('large')}
              disabled={loading !== null}
              className={`py-4 px-4 rounded-lg border-2 ${
                loading === 'large'
                  ? 'bg-muted border-muted'
                  : 'bg-card border-primary'
              }`}>
              <Text className="text-center font-semibold text-lg text-card-foreground">
                {t('buyMeCoffee.large')} - {formatPrice(prices.large, prices.currency)}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2 mt-4">
            {onDismiss && (
              <TouchableOpacity
                onPress={onDismiss}
                className="flex-1 py-3 px-4 rounded-lg bg-secondary">
                <Text className="text-center font-medium text-card-foreground">
                  {t('buyMeCoffee.dontShowAgain')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              className={`py-3 px-4 rounded-lg bg-secondary ${onDismiss ? 'flex-1' : ''}`}>
              <Text className="text-center font-medium text-card-foreground">
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
