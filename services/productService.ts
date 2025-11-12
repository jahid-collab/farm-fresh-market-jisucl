
import { supabase } from '@/app/integrations/supabase/client';
import { Product, Category, Farm } from '@/types/Product';

export const productService = {
  // Fetch all categories
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '',
        emoji: cat.emoji || '',
      }));
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  },

  // Fetch all products with farm details
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          farms (
            name,
            location
          ),
          product_categories (
            name
          )
        `)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return data.map(product => ({
        id: product.id,
        name: product.name,
        farm: product.farms?.name || 'Unknown Farm',
        location: product.farms?.location || 'Unknown Location',
        price: Number(product.price),
        originalPrice: product.original_price ? Number(product.original_price) : undefined,
        unit: product.unit || 'Per kg',
        rating: Number(product.rating) || 0,
        image: product.image || '',
        category: product.product_categories?.name || 'Other',
        inStock: product.in_stock || false,
      }));
    } catch (error) {
      console.error('Error in getProducts:', error);
      return [];
    }
  },

  // Fetch products by category
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          farms (
            name,
            location
          ),
          product_categories (
            name
          )
        `)
        .eq('category_id', categoryId)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products by category:', error);
        throw error;
      }

      return data.map(product => ({
        id: product.id,
        name: product.name,
        farm: product.farms?.name || 'Unknown Farm',
        location: product.farms?.location || 'Unknown Location',
        price: Number(product.price),
        originalPrice: product.original_price ? Number(product.original_price) : undefined,
        unit: product.unit || 'Per kg',
        rating: Number(product.rating) || 0,
        image: product.image || '',
        category: product.product_categories?.name || 'Other',
        inStock: product.in_stock || false,
      }));
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      return [];
    }
  },

  // Fetch all farms
  async getFarms(): Promise<Farm[]> {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching farms:', error);
        throw error;
      }

      return data.map(farm => ({
        id: farm.id,
        name: farm.name,
        location: farm.location || '',
        address: farm.address || '',
        rating: Number(farm.rating) || 0,
        hours: farm.hours || '',
        image: farm.image || '',
      }));
    } catch (error) {
      console.error('Error in getFarms:', error);
      return [];
    }
  },

  // Get product by ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          farms (
            name,
            location
          ),
          product_categories (
            name
          )
        `)
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        farm: data.farms?.name || 'Unknown Farm',
        location: data.farms?.location || 'Unknown Location',
        price: Number(data.price),
        originalPrice: data.original_price ? Number(data.original_price) : undefined,
        unit: data.unit || 'Per kg',
        rating: Number(data.rating) || 0,
        image: data.image || '',
        category: data.product_categories?.name || 'Other',
        inStock: data.in_stock || false,
      };
    } catch (error) {
      console.error('Error in getProductById:', error);
      return null;
    }
  },
};
