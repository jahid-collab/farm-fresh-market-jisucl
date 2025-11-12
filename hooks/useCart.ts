
import { useState, useEffect } from 'react';
import { cartService, CartItem } from '@/services/cartService';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartService.getCartItems();
      setCartItems(data);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      const success = await cartService.addToCart(productId, quantity);
      if (success) {
        await loadCart();
      }
      return success;
    } catch (err) {
      console.error('Error adding to cart:', err);
      return false;
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      const success = await cartService.updateQuantity(cartItemId, quantity);
      if (success) {
        await loadCart();
      }
      return success;
    } catch (err) {
      console.error('Error updating quantity:', err);
      return false;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const success = await cartService.removeFromCart(cartItemId);
      if (success) {
        await loadCart();
      }
      return success;
    } catch (err) {
      console.error('Error removing from cart:', err);
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const success = await cartService.clearCart();
      if (success) {
        await loadCart();
      }
      return success;
    } catch (err) {
      console.error('Error clearing cart:', err);
      return false;
    }
  };

  const getTotalPrice = (): number => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const getTotalItems = (): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    cartItems,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    refreshCart: loadCart,
  };
}
