
import { supabase } from '@/app/integrations/supabase/client';
import { Product } from '@/types/Product';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const orderService = {
  // Create order from cart
  async createOrderFromCart(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return null;
      }

      // Get user profile for delivery info - try multiple profile tables
      let profile: any = null;
      let profileError: any = null;

      // Try profiles table first
      const { data: profileData, error: err1 } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('id', user.id)
        .single();

      if (profileData) {
        profile = profileData;
      } else {
        profileError = err1;
      }

      // If no profile found, use default values
      const deliveryAddress = profile?.full_name 
        ? `${profile.full_name}'s address` 
        : 'Please update your delivery address';
      const deliveryPhone = profile?.phone || '';

      // Get cart items
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          *,
          marketplace_products (
            id,
            name,
            price
          )
        `)
        .eq('user_id', user.id);

      if (cartError) throw cartError;
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + (Number(item.marketplace_products.price) * item.quantity);
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          delivery_phone: deliveryPhone,
          notes: '',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: Number(item.marketplace_products.price),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearError) console.error('Error clearing cart:', clearError);

      return order.id;
    } catch (error) {
      console.error('Error in createOrderFromCart:', error);
      throw error;
    }
  },

  // Create order for single product (Buy Now)
  async createOrderForProduct(product: Product, quantity: number = 1): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return null;
      }

      // Get user profile for delivery info - try multiple profile tables
      let profile: any = null;

      // Try profiles table first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('id', user.id)
        .single();

      if (profileData) {
        profile = profileData;
      }

      // If no profile found, use default values
      const deliveryAddress = profile?.full_name 
        ? `${profile.full_name}'s address` 
        : 'Please update your delivery address';
      const deliveryPhone = profile?.phone || '';

      const totalAmount = product.price * quantity;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          delivery_phone: deliveryPhone,
          notes: '',
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: quantity,
          price_at_purchase: product.price,
        });

      if (itemError) {
        console.error('Order item creation error:', itemError);
        throw itemError;
      }

      return order.id;
    } catch (error) {
      console.error('Error in createOrderForProduct:', error);
      throw error;
    }
  },

  // Get user orders
  async getUserOrders(): Promise<Order[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return [];
      }

      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error in getUserOrders:', error);
      return [];
    }
  },
};
