
import { useState, useEffect } from 'react';
import { Product, Category } from '@/types/Product';
import { productService } from '@/services/productService';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // Set up an interval to refresh products every 10 seconds
    const interval = setInterval(() => {
      refreshProducts();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);

      console.log('Loaded products:', productsData.length);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      console.log('Refreshed products:', productsData.length);
      setProducts(productsData);
    } catch (err) {
      console.error('Error refreshing products:', err);
    }
  };

  return {
    products,
    categories,
    loading,
    error,
    refreshProducts,
  };
}
