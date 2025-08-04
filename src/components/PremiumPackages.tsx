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
  'com.tiebreak.appleiapapp.intermediate',
  'com.tiebreak.appleiapapp.trader',
  'com.tiebreak.appleiapapp.elite',
  'com.tiebreak.appleiapapp.expert',
];

const PACKAGE_INFO = {
  'com.tiebreak.appleiapapp.beginner': {
    title: 'Beginner Package',
    description: 'Perfect to get you started',
    features: ['Basic analytics', 'Email support', 'Mobile access'],
  },
  'com.tiebreak.appleiapapp.intermediate': {
    title: 'Intermediate Package',
    description: 'Great for intermediate users',
    features: ['Advanced analytics', 'Priority support', 'API access', 'Custom reports'],
  },
  'com.tiebreak.appleiapapp.trader': {
    title: 'Trader Package',
    description: 'Great for traders',
    features: ['Real-time data', 'Advanced charts', 'Trading signals', 'Portfolio management'],
  },
  'com.tiebreak.appleiapapp.elite': {
    title: 'Elite Package',
    description: 'Great for advanced users',
    features: ['Exclusive insights', 'Personal advisor', 'Premium alerts', 'Advanced tools'],
  },
  'com.tiebreak.appleiapapp.expert': {
    title: 'Expert Package',
    description: 'Great for expert users',
    features: ['All Elite features', 'White-label options', 'API integration', 'Custom development'],
  },
};

export const PremiumPackages: React.FC = () => {
  const [products, setProducts] = useState<PremiumPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchasedPackages, setPurchasedPackages] = useState<Set<string>>(new Set());
  
  // In a real app, this would come from your user authentication system
  const currentUserId = 'user-12345'; // Your internal user ID
  const userAppAccountToken = 'apptoken-user-12345-uuid-v4'; // UUID for this user
  
  // Toggle between mock and real App Store testing
  const USE_REAL_APP_STORE = true; // ✅ ENABLED for physical device testing

  useEffect(() => {
    if (USE_REAL_APP_STORE) {
      // Initialize real App Store IAP
      initializeIAP();
    } else {
      // For mock/test mode, show all products from StoreKit configuration
      const mockProducts: PremiumPackage[] = [
        {
          productId: 'com.tiebreak.appleiapapp.beginner',
          title: 'Beginner Package',
          price: '200.00',
          localizedPrice: '€200.00',
          currency: 'EUR',
          description: 'Perfect to get you started',
          features: ['Basic analytics', 'Email support', 'Mobile access'],
          type: 'inapp',
        },
        {
          productId: 'com.tiebreak.appleiapapp.intermediate',
          title: 'Intermediate Package',
          price: '449.99',
          localizedPrice: '€449.99',
          currency: 'EUR',
          description: 'Great for intermediate users',
          features: ['Advanced analytics', 'Priority support', 'API access', 'Custom reports'],
          type: 'inapp',
        },
        {
          productId: 'com.tiebreak.appleiapapp.trader',
          title: 'Trader Package',
          price: '749.99',
          localizedPrice: '€749.99',
          currency: 'EUR',
          description: 'Great for traders',
          features: ['Real-time data', 'Advanced charts', 'Trading signals', 'Portfolio management'],
          type: 'inapp',
        },
        {
          productId: 'com.tiebreak.appleiapapp.elite',
          title: 'Elite Package',
          price: '1000.00',
          localizedPrice: '€1000.00',
          currency: 'EUR',
          description: 'Great for advanced users',
          features: ['Exclusive insights', 'Personal advisor', 'Premium alerts', 'Advanced tools'],
          type: 'inapp',
        },
        {
          productId: 'com.tiebreak.appleiapapp.expert',
          title: 'Expert Package',
          price: '1199.99',
          localizedPrice: '€1199.99',
          currency: 'EUR',
          description: 'Great for expert users',
          features: ['All Elite features', 'White-label options', 'API integration', 'Custom development'],
          type: 'inapp',
        },
      ];
      
      setProducts(mockProducts);
      setLoading(false);
    }
    
    return () => {
      // Clean up listeners
    };
  }, []);

  const initializeIAP = async () => {
    try {
      console.log('=== REAL APP STORE IAP INITIALIZATION START ===');
      console.log('Product IDs to fetch:', PREMIUM_PRODUCT_IDS);
      console.log('Bundle ID should be: com.tiebreak.appleiapapp');
      
      // Initialize connection to App Store
      console.log('Initializing connection to App Store...');
      const connectionResult = await initConnection();
      console.log('IAP connection result:', connectionResult);

      // Set up purchase listeners for real purchases
      const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
        console.log('Purchase updated:', purchase);
        await handleRealPurchase(purchase);
      });

      const purchaseErrorSubscription = purchaseErrorListener((error) => {
        console.error('Purchase error:', error);
        Alert.alert('Purchase Error', error.message);
        setPurchasing(null);
      });

      // Get product information from App Store
      console.log('Fetching products from App Store...');
      const productList: Product[] = await getProducts({ skus: PREMIUM_PRODUCT_IDS });
      
      console.log('Products fetched from App Store:', productList);

      if (productList.length > 0) {
        const enhancedProducts: PremiumPackage[] = productList.map(product => {
          const packageInfo = PACKAGE_INFO[product.productId as keyof typeof PACKAGE_INFO];
          return {
            ...product,
            ...packageInfo,
          };
        });

        console.log('Enhanced products:', enhancedProducts);
        setProducts(enhancedProducts);
        setLoading(false);
        console.log('=== REAL IAP INITIALIZATION SUCCESS ===');
      } else {
        console.error('No products returned from App Store.');
        Alert.alert(
          'No Products Available',
          'No in-app purchase products were returned from the App Store. Please check your App Store Connect configuration.'
        );
        setLoading(false);
      }
    } catch (error) {
      console.error('=== IAP INITIALIZATION ERROR ===');
      console.error('Error initializing IAP:', error);
      Alert.alert('IAP Error', `Failed to load premium packages: ${(error as Error)?.message || String(error)}`);
      setLoading(false);
    }
  };

  const handleRealPurchase = async (purchase: Purchase) => {
    console.log('=== PROCESSING REAL APP STORE PURCHASE ===');
    console.log('Purchase details:', purchase);
    
    try {
      // Real purchases will be handled by App Store Server Notifications V2
      // Apple will send the signed JWT to your server automatically
      // Here we just need to verify the purchase locally and wait for server confirmation
      
      await finishTransaction({ purchase, isConsumable: false });
      
      // Check entitlement from server (Apple should have sent notification by now)
      setTimeout(async () => {
        await checkEntitlement(purchase.productId);
      }, 2000); // Wait 2 seconds for server processing
      
      setPurchasing(null);
      
    } catch (error) {
      console.error('Error processing real purchase:', error);
      Alert.alert('Error', 'Failed to process purchase');
      setPurchasing(null);
    }
  };

  const handlePurchase = async (productId: string) => {
    if (USE_REAL_APP_STORE) {
      return handleRealAppStorePurchase(productId);
    } else {
      return handleMockPurchase(productId);
    }
  };

  const handleRealAppStorePurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      console.log('=== INITIATING REAL APP STORE PURCHASE ===');
      console.log('ProductId:', productId);
      console.log('AppAccountToken:', userAppAccountToken);
      
      // Make real App Store purchase with appAccountToken
      await requestPurchase({
        sku: productId,
        appAccountToken: userAppAccountToken, // This links the purchase to your user
      });
      
      // Purchase handling will continue in handleRealPurchase via purchaseUpdatedListener
      
    } catch (error) {
      console.error('Error initiating real purchase:', error);
      Alert.alert('Purchase Error', 'Failed to initiate purchase');
      setPurchasing(null);
    }
  };

  const handleMockPurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      
      // Step 1: Simulate a purchase and create a mock App Store Server Notification V2 JWT
      const transactionId = `MOCK-TXN-${Date.now()}`;
      const mockNotificationPayload = {
        notificationType: 'DID_PURCHASE',
        transactionId: transactionId,
        originalTransactionId: transactionId,
        productId: productId,
        purchaseDate: new Date().toISOString(),
        userId: currentUserId, // ✅ Include internal user ID
        appAccountToken: userAppAccountToken, // ✅ Link purchase to user via appAccountToken
        bundleId: 'com.tiebreak.appleiapapp',
        environment: 'Sandbox'
      };
      
      // Create a more realistic mock JWT with both userId and appAccountToken (in production, this comes from Apple)
      // Updated JWT includes userId field for proper user mapping
      const mockJWTPayload = {
        notificationType: 'DID_PURCHASE',
        transactionId: transactionId,
        originalTransactionId: transactionId,
        productId: productId,
        purchaseDate: new Date().toISOString(),
        userId: currentUserId, // ✅ Include internal user ID for server mapping
        appAccountToken: userAppAccountToken,
        bundleId: 'com.tiebreak.appleiapapp',
        environment: 'Sandbox',
        iat: Math.floor(Date.now() / 1000),
        exp: 1900000000
      };
      
      // For demo purposes, create a simple base64 encoded JWT (in production, Apple signs this)
      const mockJWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(mockJWTPayload))}.mockSignatureWithUserIdAndAppAccountToken`;
      
      // Step 2: Send the notification to your server (simulating Apple's webhook)
      const notificationUrl = 'http://10.131.78.91:9000/appstore/notification';
      console.log('Sending App Store Server Notification V2 to server...');
      console.log('AppAccountToken:', userAppAccountToken);
      
      await fetch(notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedPayload: mockJWT }),
      });
      
      // Step 3: Wait a moment for server processing, then check entitlement
      setTimeout(async () => {
        await checkEntitlement(productId);
      }, 1000);
      
      setPurchasing(null);
    } catch (error) {
      console.error('Error in mock purchase:', error);
      Alert.alert('Error', 'Failed to simulate purchase.');
      setPurchasing(null);
    }
  };

  const checkEntitlement = async (productId: string) => {
    try {
      // Use the appAccountToken to check entitlement (this links to your internal user system)
      const entitlementUrl = `http://10.131.78.91:9000/api/user/token/${userAppAccountToken}/entitlement/${productId}`;
      
      console.log('Checking entitlement from server using appAccountToken...');
      console.log('AppAccountToken:', userAppAccountToken);
      const response = await fetch(entitlementUrl);
      
      if (response.ok) {
        const entitlementData = await response.json();
        console.log('Entitlement response:', entitlementData);
        
        if (entitlementData.hasAccess) {
          setPurchasedPackages(prev => new Set([...prev, productId]));
          Alert.alert(
            'Purchase Successful!', 
            `Premium package activated!\n\nUser ID: ${entitlementData.userId}\nEntitlement: ${entitlementData.entitlementLevel}\nExpires: ${entitlementData.expiresAt || 'Never'}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Purchase Failed', 'Unable to verify entitlement with server.');
        }
      } else {
        Alert.alert('Server Error', 'Failed to check entitlement status.');
      }
    } catch (error) {
      console.error('Error checking entitlement:', error);
      Alert.alert('Error', 'Failed to verify purchase with server.');
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
