
import { supabase } from '@/app/integrations/supabase/client';
import { Product } from '@/types/Product';

export const favoriteService = {
  // Get favorite products for current user
  async getFavorites(): Promise<Product[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return [];
      }

      const { data, error } = await supabase
        .from('product_favorites')
        .select(`
          *,
          marketplace_products (
            *,
            farms (
              name,
              location
            ),
            product_categories (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }

      return data.map(fav => ({
        id: fav.marketplace_products.id,
        name: fav.marketplace_products.name,
        farm: fav.marketplace_products.farms?.name || 'Unknown Farm',
        location: fav.marketplace_products.farms?.location || 'Unknown Location',
        price: Number(fav.marketplace_products.price),
        originalPrice: fav.marketplace_products.original_price ? Number(fav.marketplace_products.original_price) : undefined,
        unit: fav.marketplace_products.unit || 'Per kg',
        rating: Number(fav.marketplace_products.rating) || 0,
        image: fav.marketplace_products.image || '',
        category: fav.marketplace_products.product_categories?.name || 'Other',
        inStock: fav.marketplace_products.in_stock || false,
      }));
    } catch (error) {
      console.error('Error in getFavorites:', error);
      return [];
    }
  },

  // Check if product is favorited
  async isFavorite(productId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('product_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isFavorite:', error);
      return false;
    }
  },

  // Add product to favorites
  async addToFavorites(productId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return false;
      }

      const { error } = await supabase
        .from('product_favorites')
        .insert({
          user_id: user.id,
          product_id: productId,
        });

      if (error) {
        console.error('Error adding to favorites:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in addToFavorites:', error);
      return false;
    }
  },

  // Remove product from favorites
  async removeFromFavorites(productId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return false;
      }

      const { error } = await supabase
        .from('product_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from favorites:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in removeFromFavorites:', error);
      return false;
    }
  },

  // Toggle favorite status
  async toggleFavorite(productId: string): Promise<boolean> {
    try {
      const isFav = await this.isFavorite(productId);
      if (isFav) {
        return await this.removeFromFavorites(productId);
      } else {
        return await this.addToFavorites(productId);
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return false;
    }
  },
};
