
import { supabase } from '@/app/integrations/supabase/client';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    unit: string;
    farm: string;
  };
}

export const cartService = {
  // Get cart items for current user
  async getCartItems(): Promise<CartItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in for getCartItems');
        return [];
      }

      console.log('Fetching cart items for user:', user.id);

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          marketplace_products (
            id,
            name,
            price,
            image,
            unit,
            farms (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart items:', error);
        throw error;
      }

      console.log('Raw cart data:', data);

      const cartItems = data.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          id: item.marketplace_products.id,
          name: item.marketplace_products.name,
          price: Number(item.marketplace_products.price),
          image: item.marketplace_products.image || '',
          unit: item.marketplace_products.unit || 'Per kg',
          farm: item.marketplace_products.farms?.name || 'Unknown Farm',
        },
      }));

      console.log('Processed cart items:', cartItems);
      return cartItems;
    } catch (error) {
      console.error('Error in getCartItems:', error);
      return [];
    }
  },

  // Add item to cart
  async addToCart(productId: string, quantity: number = 1): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in for addToCart');
        return false;
      }

      console.log('Adding to cart - User:', user.id, 'Product:', productId, 'Quantity:', quantity);

      // Check if item already exists in cart
      const { data: existing, error: existingError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing cart item:', existingError);
        throw existingError;
      }

      if (existing) {
        console.log('Item already in cart, updating quantity');
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating cart item:', error);
          throw error;
        }
        console.log('Cart item quantity updated successfully');
      } else {
        console.log('Item not in cart, inserting new item');
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });

        if (error) {
          console.error('Error adding to cart:', error);
          throw error;
        }
        console.log('New cart item added successfully');
      }

      return true;
    } catch (error) {
      console.error('Error in addToCart:', error);
      return false;
    }
  },

  // Update cart item quantity
  async updateQuantity(cartItemId: string, quantity: number): Promise<boolean> {
    try {
      console.log('Updating cart item quantity:', cartItemId, 'to', quantity);

      if (quantity <= 0) {
        return await this.removeFromCart(cartItemId);
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) {
        console.error('Error updating quantity:', error);
        throw error;
      }

      console.log('Quantity updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateQuantity:', error);
      return false;
    }
  },

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<boolean> {
    try {
      console.log('Removing cart item:', cartItemId);

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }

      console.log('Cart item removed successfully');
      return true;
    } catch (error) {
      console.error('Error in removeFromCart:', error);
      return false;
    }
  },

  // Clear cart
  async clearCart(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in for clearCart');
        return false;
      }

      console.log('Clearing cart for user:', user.id);

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing cart:', error);
        throw error;
      }

      console.log('Cart cleared successfully');
      return true;
    } catch (error) {
      console.error('Error in clearCart:', error);
      return false;
    }
  },
};
