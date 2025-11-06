import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Recipe } from '../types';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => Promise<void>;
  favoriteRecipes: Recipe[];
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
      setFavoriteRecipes([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (favorites.length > 0 && user) {
      loadFavoriteRecipes();
    } else {
      setFavoriteRecipes([]);
    }
  }, [favorites, user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const favoritesDoc = await getDoc(doc(db, 'users', user.uid));
      if (favoritesDoc.exists()) {
        const data = favoritesDoc.data();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteRecipes = async () => {
    if (!user || favorites.length === 0) {
      setFavoriteRecipes([]);
      return;
    }

    try {
      const recipes: Recipe[] = [];
      
      for (const recipeId of favorites) {
        try {
          const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
          if (recipeDoc.exists()) {
            recipes.push({ id: recipeDoc.id, ...recipeDoc.data() } as Recipe);
          }
        } catch (error) {
          console.error(`Error loading recipe ${recipeId}:`, error);
        }
      }

      setFavoriteRecipes(recipes);
    } catch (error) {
      console.error('Error loading favorite recipes:', error);
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      let currentFavorites: string[] = [];
      if (userDoc.exists()) {
        currentFavorites = userDoc.data().favorites || [];
      }

      const isCurrentlyFavorite = currentFavorites.includes(recipeId);
      let newFavorites: string[];

      if (isCurrentlyFavorite) {
        newFavorites = currentFavorites.filter((id) => id !== recipeId);
      } else {
        newFavorites = [...currentFavorites, recipeId];
      }

      await setDoc(userRef, { favorites: newFavorites }, { merge: true });
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const isFavorite = (recipeId: string): boolean => {
    return favorites.includes(recipeId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        favoriteRecipes,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

