import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteIds = new Set(data.map(fav => fav.property_id));
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      alert('Please sign in to save favorites');
      return;
    }

    const isFavorite = favorites.has(propertyId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) throw error;

        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: propertyId,
          });

        if (error) throw error;

        setFavorites(prev => new Set(prev).add(propertyId));
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites: ' + error.message);
    }
  };

  const isFavorite = (propertyId: string) => favorites.has(propertyId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
  };
}
