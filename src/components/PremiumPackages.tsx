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
  'com.tiebreak.appleiapapp.beginner',
  // Testing with just one product first to isolate sandbox issues
  // 'com.tiebreak.appleiapapp.intermediate',
  // 'com.tiebreak.appleiapapp.trader',
  // 'com.tiebreak.appleiapapp.elite',
  // 'com.tiebreak.appleiapapp.expert',
];

const PACKAGE_INFO = {
  'com.tiebreak.appleiapapp.beginner': {
    title: 'Beginner',
    description: 'Perfect for getting started',
    features: ['Basic analytics', 'Email support', 'Mobile access'],
  },
  'com.tiebreak.appleiapapp.intermediate': {
    title: 'Intermediate',
    description: 'Enhanced features for growing users',
    features: ['Advanced analytics', 'Priority support', 'API access', 'Custom reports'],
  },
  'com.tiebreak.appleiapapp.trader': {
    title: 'Trader',
    description: 'Professional tools for active traders',
    features: ['Real-time data', 'Advanced charts', 'Trading signals', 'Portfolio management'],
  },
  'com.tiebreak.appleiapapp.elite': {
    title: 'Elite',
    description: 'Premium experience for serious investors',
    features: ['Exclusive insights', 'Personal advisor', 'Premium alerts', 'Advanced tools'],
  },
  'com.tiebreak.appleiapapp.expert': {
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
    console.log('PremiumPackages component mounted');
    initializeIAP();
    return () => {
      // Clean up listeners
    };
  }, []);

  const initializeIAP = async () => {
    try {
      console.log('=== IAP INITIALIZATION START ===');
      console.log('Product IDs to fetch:', PREMIUM_PRODUCT_IDS);
      console.log('Bundle ID should be: com.tiebreak.appleiapapp');
      console.log('Current environment: sandbox (should be sandbox for testing)');
      console.log('Device network status: checking...');
      
      // Check platform and environment
      console.log('Platform.OS:', require('react-native').Platform.OS);
      console.log('__DEV__:', __DEV__);
      console.log('Testing with reduced product set to isolate issue');
      
      // Check if we can reach Apple servers
      console.log('Testing connectivity to Apple services...');
      
      // Check current App Store sign-in status
      console.log('=== SANDBOX USER CHECK ===');
      console.log('IMPORTANT: Make sure you are:');
      console.log('1. Signed OUT of App Store in Settings');
      console.log('2. Will sign in with sandbox user ONLY when prompted during purchase');
      console.log('3. Using a valid sandbox test user from App Store Connect');
      console.log('============================');
      
      // Initialize connection to App Store
      console.log('Initializing connection to App Store...');
      const connectionResult = await initConnection();
      console.log('IAP connection result:', connectionResult);
      console.log('IAP connection initialized successfully');

      // TESTING: Let's try to see what happens if we skip the App Store entirely
      // and use mock data to test the UI first
      console.log('=== TESTING MODE: Using mock products ===');
      const mockProducts = [
        {
          productId: 'com.tiebreak.appleiapapp.beginner',
          title: 'Beginner (Mock)',
          price: '200.00',
          localizedPrice: '€200.00',
          currency: 'EUR',
          description: 'Perfect for getting started',
        }
      ];
      
      console.log('Mock products created:', mockProducts);

      // Get product information from App Store
      console.log('Fetching products from App Store...');
      console.log('Requesting products with SKUs:', PREMIUM_PRODUCT_IDS);
      
      // Add a small delay to ensure connection is fully established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        console.log('=== ATTEMPTING PRODUCT FETCH ===');
        console.log('About to call getProducts with SKUs:', PREMIUM_PRODUCT_IDS);
        console.log('Current device region:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        console.log('Current device locale:', Intl.DateTimeFormat().resolvedOptions().locale);
        
        const productList = await getProducts({ skus: PREMIUM_PRODUCT_IDS });
        console.log('=== PRODUCT FETCH RESULT ===');
        console.log('Raw products fetched from App Store:', JSON.stringify(productList, null, 2));
        console.log('Number of products returned:', productList.length);
        
        if (productList.length > 0) {
          // SUCCESS! Products loaded
          const enhancedProducts: PremiumPackage[] = productList.map(product => {
            console.log('Processing product:', product.productId, 'Price:', product.localizedPrice, 'Currency:', product.currency);
            return {
              ...product,
              ...PACKAGE_INFO[product.productId as keyof typeof PACKAGE_INFO],
            };
          });

          console.log('=== ENHANCED PRODUCTS ===');
          console.log('Enhanced products:', JSON.stringify(enhancedProducts, null, 2));
          setProducts(enhancedProducts);
          setLoading(false);
          console.log('=== IAP INITIALIZATION SUCCESS ===');
          return;
        }
      } catch (parseError) {
        console.error('=== STOREKIT PARSING ERROR ===');
        console.error('Detailed error:', parseError);
        console.error('This is the price configuration issue we detected');
        
        Alert.alert(
          'Price Configuration Error', 
          'StoreKit found your products but could not parse the price information.\n\nPlease fix the pricing in App Store Connect:\n\n1. Use standard price tiers instead of custom prices\n2. Check territory settings\n3. Ensure all price fields are filled'
        );
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('=== IAP INITIALIZATION ERROR ===');
      console.error('Error initializing IAP:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'IAP Error', 
        `Failed to load premium packages: ${(error as Error)?.message || String(error)}`
      );
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

      {products.length === 0 && !loading && (
        <View style={styles.noProductsContainer}>
          <Text style={styles.noProductsTitle}>No Products Available</Text>
          <Text style={styles.noProductsText}>
            In-app purchases are not currently available.{'\n\n'}
            Please check:
            {'\n'}• In-App Purchases are "Ready to Submit" in App Store Connect
            {'\n'}• Bundle ID matches exactly: com.tiebreak.appleiapapp
            {'\n'}• SANDBOX USER: Sign OUT of App Store in Settings first
            {'\n'}• Sign in with sandbox user ONLY when prompted during purchase
            {'\n'}• Try running from Xcode instead of TestFlight
            {'\n'}• Check Xcode console for detailed error logs
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              initializeIAP();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

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
  noProductsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noProductsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  noProductsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
