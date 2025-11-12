
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { colors } from '@/styles/commonStyles';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/Product';
import { useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/hooks/useCart';

export default function FavoritesScreen() {
  const { favorites, loading, error, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  const handleAddToCart = async (product: Product) => {
    console.log('Add to cart:', product.name);
    const success = await addToCart(product.id);
    if (success) {
      Alert.alert('Success', `${product.name} added to cart!`);
    } else {
      Alert.alert('Error', 'Please sign in to add items to cart');
    }
  };

  const handleBuyNow = (product: Product) => {
    console.log('Buy now:', product.name);
    Alert.alert('Buy Now', `Proceeding to checkout for ${product.name}`);
  };

  const handleRemoveFavorite = async (product: Product) => {
    const success = await toggleFavorite(product.id);
    if (success) {
      Alert.alert('Removed', `${product.name} removed from favorites`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading favorites...</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
        <Text style={styles.subtitle}>
          {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Start adding products to your favorites to see them here
          </Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {favorites.map((product) => (
            <View key={product.id} style={styles.productWrapper}>
              <ProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFavorite(product)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

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
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  productsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  productWrapper: {
    marginBottom: 8,
  },
  removeButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
});
