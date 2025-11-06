import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, orderBy, startAt, endAt, limit, startAfter } from 'firebase/firestore';
import { CATEGORIES, PREP_TIME_FILTERS } from '../../constants/recipes';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Recipe, RootStackParamList, RecipeFilters } from '../../types';
import { RecipeCard } from '../../components/RecipeCard';
import { FilterModal } from '../../components/FilterModal';

type RecipesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Recipes'>;

// moved to constants

export const RecipesScreen: React.FC = () => {
  const navigation = useNavigation<RecipesScreenNavigationProp>();
  const { user, userData, signOutUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadRecipes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setLastVisible(null);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      let q: any = collection(db, 'recipes');

      if (searchQuery.trim()) {
        q = query(q, orderBy('title'), startAt(searchQuery.trim()), endAt(searchQuery.trim() + '\uf8ff'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      if (filters.category && filters.category !== 'All') {
        q = query(q, where('category', '==', filters.category));
      }

      if (lastVisible && !isRefresh) {
        q = query(q, startAfter(lastVisible));
      }

      q = query(q, limit(12));

      const querySnapshot = await getDocs(q);

      const recipesData: Recipe[] = [];
      querySnapshot.forEach((doc) => {
        recipesData.push({ id: doc.id, ...doc.data() } as Recipe);
      });

      let filteredRecipes = recipesData;
      if (filters.prepTime) {
        filteredRecipes = recipesData.filter((recipe) => {
          const prepTime = recipe.prepTime;
          switch (filters.prepTime) {
            case '<15':
              return prepTime < 15;
            case '<30':
              return prepTime < 30;
            case '<60':
              return prepTime < 60;
            case '>60':
              return prepTime >= 60;
            default:
              return true;
          }
        });
      }

      if (isRefresh) {
        setRecipes(filteredRecipes);
      } else {
        setRecipes((prev) => [...prev, ...filteredRecipes]);
      }

      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === 12);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters, lastVisible]);

  useEffect(() => {
    loadRecipes(true);
  }, [searchQuery, filters.category, filters.prepTime]);

  const handleFilterApply = (newFilters: RecipeFilters) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  const handleLogout = async () => {
    await signOutUser();
    navigation.replace('Auth');
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      onPress={() => navigation.navigate('RecipeDetails', { recipeId: item.id! })}
    />
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Hi, {userData?.firstName || 'User'}!</Text>
            <Text style={styles.headerTitle}>Find a recipe</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.newPostButton}
              onPress={() => navigation.navigate('NewRecipe' as never, {} as never)}
            >
              <Text style={styles.newPostButtonText}>+ New</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && recipes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id || Math.random().toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadRecipes(true)} />
          }
          onEndReached={() => {
            if (hasMore && !loading) {
              loadRecipes();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          }
        />
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        categories={CATEGORIES}
        prepTimeFilters={PREP_TIME_FILTERS}
        currentFilters={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  newPostButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newPostButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButton: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  listContent: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

