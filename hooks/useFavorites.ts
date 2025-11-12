
import { useState, useEffect } from 'react';
import { Product } from '@/types/Product';
import { favoriteService } from '@/services/favoriteService';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await favoriteService.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const success = await favoriteService.toggleFavorite(productId);
      if (success) {
        await loadFavorites();
      }
      return success;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return false;
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.some(fav => fav.id === productId);
  };

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
}
