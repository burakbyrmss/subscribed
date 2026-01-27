import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import * as IAP from 'react-native-iap';

const PRODUCT_IDS = {
  small: 'coffee_small', // $1
  medium: 'coffee_medium', // $5
  large: 'coffee_large', // $10
};

const PRODUCT_PRICES = {
  small: 1,
  medium: 5,
  large: 10,
};

interface BuyMeCoffeeProps {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
}

export function BuyMeCoffee({ visible, onClose, onDismiss }: BuyMeCoffeeProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState<string | null>(null);

  const handlePurchase = async (productId: keyof typeof PRODUCT_IDS) => {
    try {
      setLoading(productId);
      
      // Initialize IAP connection
      await IAP.initConnection();
      
      // Get available products
      const products = await IAP.getProducts([PRODUCT_IDS[productId]]);
      
      if (products.length === 0) {
        Alert.alert(t('buyMeCoffee.error'), t('buyMeCoffee.productNotFound'));
        setLoading(null);
        return;
      }

      // Request purchase
      await IAP.requestPurchase(PRODUCT_IDS[productId], false);
      
      Alert.alert(
        t('buyMeCoffee.success'),
        t('buyMeCoffee.thankYou', { amount: PRODUCT_PRICES[productId] })
      );
      
      onClose();
    } catch (error: any) {
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert(t('buyMeCoffee.error'), error.message || t('buyMeCoffee.purchaseFailed'));
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
      // Handle successful purchase
      IAP.finishTransaction(purchase, true).catch(console.error);
    });

    const purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert(t('buyMeCoffee.error'), error.message || t('buyMeCoffee.purchaseFailed'));
      }
      setLoading(null);
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, [visible, t]);

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
                {t('buyMeCoffee.small')} - $1
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
                {t('buyMeCoffee.medium')} - $5
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
                {t('buyMeCoffee.large')} - $10
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
