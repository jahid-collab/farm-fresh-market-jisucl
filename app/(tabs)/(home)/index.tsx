
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DeliveryBanner from '@/components/DeliveryBanner';
import React, { useState } from 'react';
import { Product, Category } from '@/types/Product';
import CategoryChip from '@/components/CategoryChip';
import { colors } from '@/styles/commonStyles';
import ProductCard from '@/components/ProductCard';
import { IconSymbol } from '@/components/IconSymbol';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { orderService } from '@/services/orderService';
import { supabase } from '@/app/integrations/supabase/client';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  
  const { products, categories, loading, error } = useProducts();
  const { addToCart } = useCart();

  const handleCategoryPress = (category: Category) => {
    console.log('Category pressed:', category.name);
    if (selectedCategory === category.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category.id);
    }
  };

  const handleAddToCart = async (product: Product) => {
    console.log('Add to cart:', product.name);
    
    // Check if user is signed in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to add items to your cart',
        [{ text: 'OK' }]
      );
      return;
    }

    const success = await addToCart(product.id);
    if (success) {
      Alert.alert('Success', `${product.name} added to cart!`);
    } else {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const handleBuyNow = async (product: Product) => {
    console.log('Buy now:', product.name);
    
    // Check if user is signed in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to place an order',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Do you want to buy ${product.name} for $${product.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            try {
              setProcessingOrder(true);
              const orderId = await orderService.createOrderForProduct(product, 1);
              
              if (orderId) {
                Alert.alert(
                  'Order Placed!',
                  `Your order for ${product.name} has been placed successfully. Order ID: ${orderId.substring(0, 8)}...`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', 'Failed to place order. Please try again.');
              }
            } catch (error: any) {
              console.error('Error placing order:', error);
              Alert.alert('Error', error.message || 'Failed to place order. Please try again.');
            } finally {
              setProcessingOrder(false);
            }
          },
        },
      ]
    );
  };

  const handleOrderNow = () => {
    console.log('Order now pressed');
    Alert.alert('Order Now', 'Delivery service coming soon!');
  };

  // Filter products based on selected category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || 
      categories.find(cat => cat.id === selectedCategory)?.name === product.category;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {processingOrder && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Processing your order...</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.subtitle}>Let&apos;s order fresh items for you</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <IconSymbol 
              ios_icon_name="bell.fill" 
              android_material_icon_name="notifications" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <IconSymbol 
            ios_icon_name="magnifyingglass" 
            android_material_icon_name="search" 
            size={20} 
            color={colors.textSecondary} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <DeliveryBanner onOrderNow={handleOrderNow} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategoryPress(category)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name 
              : 'Featured Products'}
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
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
    padding: 20,
    paddingTop: 48,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  productsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
