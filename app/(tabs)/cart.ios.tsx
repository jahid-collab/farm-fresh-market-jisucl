
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useCart } from '@/hooks/useCart';
import { orderService } from '@/services/orderService';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { useFocusEffect } from '@react-navigation/native';

export default function CartScreen() {
  const router = useRouter();
  const {
    cartItems,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
    refreshCart,
  } = useCart();

  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Refresh cart when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Cart screen focused, refreshing cart...');
      refreshCart();
    }, [])
  );

  const handleIncreaseQuantity = async (cartItemId: string, currentQuantity: number) => {
    console.log('Increasing quantity for cart item:', cartItemId);
    await updateQuantity(cartItemId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = async (cartItemId: string, currentQuantity: number) => {
    console.log('Decreasing quantity for cart item:', cartItemId);
    if (currentQuantity > 1) {
      await updateQuantity(cartItemId, currentQuantity - 1);
    } else {
      handleRemoveItem(cartItemId);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            console.log('Removing item from cart:', cartItemId);
            const success = await removeFromCart(cartItemId);
            if (success) {
              Alert.alert('Success', 'Item removed from cart');
            } else {
              Alert.alert('Error', 'Failed to remove item from cart');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    // Check if user is signed in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to proceed with checkout',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.push('/(tabs)/auth'),
          },
        ]
      );
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some items first!');
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Total: $${getTotalPrice().toFixed(2)}\n\nDo you want to proceed with this order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            try {
              setProcessingCheckout(true);
              const orderId = await orderService.createOrderFromCart();

              if (orderId) {
                Alert.alert(
                  'Order Placed Successfully! 🎉',
                  `Your order has been placed.\n\nOrder ID: ${orderId.substring(0, 8)}...\n\nYou will receive a confirmation shortly.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        refreshCart();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', 'Failed to place order. Please try again.');
              }
            } catch (error: any) {
              console.error('Error during checkout:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to place order. Please try again.'
              );
            } finally {
              setProcessingCheckout(false);
            }
          },
        },
      ]
    );
  };

  const handleContinueShopping = () => {
    router.push('/(tabs)/(home)/');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle.fill"
          android_material_icon_name="error"
          size={48}
          color={colors.error}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshCart}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol
          ios_icon_name="cart"
          android_material_icon_name="shopping_cart"
          size={80}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some fresh products to get started!
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={handleContinueShopping}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const deliveryFee = 5.0;
  const tax = totalPrice * 0.08; // 8% tax
  const grandTotal = totalPrice + deliveryFee + tax;

  return (
    <View style={styles.container}>
      {processingCheckout && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Processing your order...</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{totalItems} items</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cartItemsContainer}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image
                source={{ uri: item.product.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.productFarm} numberOfLines={1}>
                  {item.product.farm}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>
                    ${item.product.price.toFixed(2)}
                  </Text>
                  <Text style={styles.productUnit}>{item.product.unit}</Text>
                </View>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleDecreaseQuantity(item.id, item.quantity)}
                >
                  <IconSymbol
                    ios_icon_name="minus"
                    android_material_icon_name="remove"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleIncreaseQuantity(item.id, item.quantity)}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <IconSymbol
                  ios_icon_name="trash"
                  android_material_icon_name="delete"
                  size={20}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (8%)</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.checkoutContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalAmount}>${grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={processingCheckout}
        >
          <Text style={styles.checkoutButtonText}>
            {processingCheckout ? 'Processing...' : 'Proceed to Checkout'}
          </Text>
          <IconSymbol
            ios_icon_name="arrow.right"
            android_material_icon_name="arrow_forward"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  cartItemsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  productFarm: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  productUnit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
