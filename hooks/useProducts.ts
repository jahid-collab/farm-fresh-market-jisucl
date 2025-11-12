
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
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);

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
    await loadData();
  };

  return {
    products,
    categories,
    loading,
    error,
    refreshProducts,
  };
}
