
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
        console.log('No user logged in');
        return [];
      }

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

      return data.map(item => ({
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
        console.log('No user logged in');
        return false;
      }

      // Check if item already exists in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating cart item:', error);
          throw error;
        }
      } else {
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

      return true;
    } catch (error) {
      console.error('Error in updateQuantity:', error);
      return false;
    }
  },

  // Remove item from cart
  async removeFromCart(cartItemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }

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
        console.log('No user logged in');
        return false;
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing cart:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in clearCart:', error);
      return false;
    }
  },
};
