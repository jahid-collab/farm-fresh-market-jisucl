
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
      console.log('Loading cart...');
      setLoading(true);
      setError(null);
      const data = await cartService.getCartItems();
      console.log('Cart loaded successfully:', data.length, 'items');
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
      console.log('Adding to cart:', productId, 'quantity:', quantity);
      const success = await cartService.addToCart(productId, quantity);
      console.log('Add to cart result:', success);
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
      console.log('Updating quantity:', cartItemId, 'to', quantity);
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
      console.log('Removing from cart:', cartItemId);
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
      console.log('Clearing cart...');
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
