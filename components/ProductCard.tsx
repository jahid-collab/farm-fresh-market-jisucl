
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Product } from '@/types/Product';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { useRouter } from 'expo-router';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onBuyNow }: ProductCardProps) {
  const router = useRouter();

  const handleAddToCart = () => {
    console.log('Add to cart button pressed:', product.name);
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleBuyNow = () => {
    console.log('Buy now button pressed:', product.name);
    if (onBuyNow) {
      onBuyNow(product);
    }
  };

  const handleCardPress = () => {
    console.log('Product card pressed:', product.name);
    // Commenting out navigation for now since product detail page doesn't exist
    // router.push(`/product/${product.id}`);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.imageContainer} 
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.ratingBadge}>
          <IconSymbol
            ios_icon_name="star.fill"
            android_material_icon_name="star"
            size={12}
            color={colors.accent}
          />
          <Text style={styles.ratingText}>{product.rating}</Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <IconSymbol
            ios_icon_name="heart"
            android_material_icon_name="favorite_border"
            size={20}
            color={colors.card}
          />
        </TouchableOpacity>
        <View style={styles.farmBadge}>
          <IconSymbol
            ios_icon_name="leaf.fill"
            android_material_icon_name="eco"
            size={12}
            color={colors.card}
          />
          <Text style={styles.farmBadgeText} numberOfLines={1}>
            {product.farm}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>{product.originalPrice} USD</Text>
          )}
          <Text style={styles.price}>{product.price} USD</Text>
          <Text style={styles.unit}>{product.unit}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.7}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.buyNowButton}
            onPress={handleBuyNow}
            activeOpacity={0.7}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '70%',
  },
  farmBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.card,
  },
  content: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  unit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buyNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
});
