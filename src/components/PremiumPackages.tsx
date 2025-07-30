import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getProducts,
  requestPurchase,
  Product,
  Purchase,
  ProductPurchase,
} from 'react-native-iap';

interface PremiumPackage extends Product {
  title: string;
  description: string;
  features: string[];
}

const PREMIUM_PRODUCT_IDS = [
  'com.yourapp.beginner',
  'com.yourapp.intermediate',
  'com.yourapp.trader',
  'com.yourapp.elite',
  'com.yourapp.expert',
];

const PACKAGE_INFO = {
  'com.yourapp.beginner': {
    title: 'Beginner',
    description: 'Perfect for getting started',
    features: ['Basic analytics', 'Email support', 'Mobile access'],
  },
  'com.yourapp.intermediate': {
    title: 'Intermediate',
    description: 'Enhanced features for growing users',
    features: ['Advanced analytics', 'Priority support', 'API access', 'Custom reports'],
  },
  'com.yourapp.trader': {
    title: 'Trader',
    description: 'Professional tools for active traders',
    features: ['Real-time data', 'Advanced charts', 'Trading signals', 'Portfolio management'],
  },
  'com.yourapp.elite': {
    title: 'Elite',
    description: 'Premium experience for serious investors',
    features: ['Exclusive insights', 'Personal advisor', 'Premium alerts', 'Advanced tools'],
  },
  'com.yourapp.expert': {
    title: 'Expert',
    description: 'Ultimate package for professionals',
    features: ['All Elite features', 'White-label options', 'API integration', 'Custom development'],
  },
};

export const PremiumPackages: React.FC = () => {
  const [products, setProducts] = useState<PremiumPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchasedPackages, setPurchasedPackages] = useState<Set<string>>(new Set());

  useEffect(() => {
    initializeIAP();
    return () => {
      // Clean up listeners
    };
  }, []);

  const initializeIAP = async () => {
    try {
      // Initialize connection to App Store
      await initConnection();
      console.log('IAP connection initialized');

      // Get product information from App Store
      const productList = await getProducts({ skus: PREMIUM_PRODUCT_IDS });
      console.log('Products fetched:', productList);

      // Enhance products with additional info
      const enhancedProducts: PremiumPackage[] = productList.map(product => ({
        ...product,
        ...PACKAGE_INFO[product.productId as keyof typeof PACKAGE_INFO],
      }));

      setProducts(enhancedProducts);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing IAP:', error);
      Alert.alert('Error', 'Failed to load premium packages');
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      
      // Set up purchase listeners
      const purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: Purchase) => {
          console.log('Purchase updated:', purchase);
          
          if (purchase.productId === productId) {
            try {
              // Verify purchase with your server
              await verifyPurchaseWithServer(purchase);
              
              // Finish the transaction
              await finishTransaction({ purchase, isConsumable: false });
              
              // Update local state
              setPurchasedPackages(prev => new Set([...prev, productId]));
              
              Alert.alert(
                'Purchase Successful!',
                'Your premium package has been activated.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error finishing transaction:', error);
              Alert.alert('Error', 'Failed to complete purchase');
            }
          }
          
          setPurchasing(null);
        }
      );

      const purchaseErrorSubscription = purchaseErrorListener(
        (error: any) => {
          console.error('Purchase error:', error);
          Alert.alert('Purchase Failed', error.message || 'An error occurred during purchase');
          setPurchasing(null);
        }
      );

      // Request purchase
      await requestPurchase({ sku: productId });

      // Clean up listeners after some time
      setTimeout(() => {
        purchaseUpdateSubscription.remove();
        purchaseErrorSubscription.remove();
      }, 30000);

    } catch (error) {
      console.error('Error initiating purchase:', error);
      Alert.alert('Error', 'Failed to initiate purchase');
      setPurchasing(null);
    }
  };

  const verifyPurchaseWithServer = async (purchase: Purchase) => {
    try {
      // In a real app, you would send the purchase receipt to your server
      // for verification and premium content activation
      console.log('Verifying purchase with server:', purchase);
      
      // For demo purposes, we'll just log the purchase
      // Your server should handle the App Store Server Notification
      // and activate the premium content automatically
      
      return true;
    } catch (error) {
      console.error('Server verification failed:', error);
      throw error;
    }
  };

  const formatPrice = (price: string, currency: string) => {
    return `${price} ${currency}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading premium packages...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Premium Packages</Text>
      <Text style={styles.subtitle}>
        Choose the perfect package to unlock premium features
      </Text>

      {products.map((product) => {
        const isPurchased = purchasedPackages.has(product.productId);
        const isPurchasing = purchasing === product.productId;

        return (
          <View key={product.productId} style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageTitle}>{product.title}</Text>
              <Text style={styles.packagePrice}>
                {formatPrice(product.localizedPrice, product.currency)}
              </Text>
            </View>
            
            <Text style={styles.packageDescription}>
              {product.description}
            </Text>

            <View style={styles.featuresContainer}>
              {product.features?.map((feature, index) => (
                <Text key={index} style={styles.feature}>
                  • {feature}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                isPurchased && styles.purchasedButton,
                isPurchasing && styles.purchasingButton,
              ]}
              onPress={() => handlePurchase(product.productId)}
              disabled={isPurchased || isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {isPurchased ? 'Purchased' : 'Purchase'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  packageDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 6,
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  purchasedButton: {
    backgroundColor: '#28a745',
  },
  purchasingButton: {
    backgroundColor: '#6c757d',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
