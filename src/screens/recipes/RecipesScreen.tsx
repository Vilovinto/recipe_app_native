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
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, orderBy, startAt, endAt, limit, startAfter, doc, deleteDoc } from 'firebase/firestore';
import { CATEGORIES, PREP_TIME_FILTERS } from '../../constants/recipes';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Recipe, RootStackParamList, RecipeFilters } from '../../types';
import { RecipeCard } from '../../components/RecipeCard';
import { SidebarFilters } from '../../components/SidebarFilters';
import { colors } from '../../constants/theme';

const ITEMS_PER_PAGE = 12;

type RecipesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Recipes'>;

export const RecipesScreen: React.FC = () => {
  const navigation = useNavigation<RecipesScreenNavigationProp>();
  const { user, userData, signOutUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const isPhone = screenWidth <= 480;
  const numColumns = screenWidth > 768 ? 3 : 2;
  const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/recipe-app-caa91.firebasestorage.app/o/recipe-images%2FjfU84aSjTTX2qZlIyJpYyCM753K2%2FFrame.png?alt=media&token=9b9ca196-c9d2-47f2-b15f-da2bf14cb583';
  const avatarUrl = 'https://firebasestorage.googleapis.com/v0/b/recipe-app-caa91.firebasestorage.app/o/recipe-images%2FjfU84aSjTTX2qZlIyJpYyCM753K2%2Fb45fff6b8e9ca09258e544c7bd3e6cd00180d427.png?alt=media&token=1a55bd3d-6270-4733-921d-8d77036d280a';

  const loadRecipes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setLastVisible(null);
        setHasMore(true);
        setCurrentPage(1);
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

      q = query(q, limit(ITEMS_PER_PAGE + 1));

      const querySnapshot = await getDocs(q);

      const rawDocs = Array.from(querySnapshot.docs);
      const hasNext = rawDocs.length === ITEMS_PER_PAGE + 1;
      const docs = hasNext ? rawDocs.slice(0, -1) : rawDocs;
      const recipesData: Recipe[] = docs.map((snapshot) => {
        const data = snapshot.data() as Recipe;
        return { id: snapshot.id, ...data };
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

      const lastDocForCursor = docs[docs.length - 1] || rawDocs[rawDocs.length - 1] || null;
      setLastVisible(lastDocForCursor ?? null);

      setHasMore(hasNext);
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

  const handleFilterChange = (newFilters: RecipeFilters) => {
    setFilters(newFilters);
  };

  const handleLogout = async () => {
    await signOutUser();
    navigation.replace('Auth');
    setShowUserMenu(false);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    if (!recipe.id) return;
    navigation.navigate('NewRecipe', { recipeId: recipe.id });
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (!recipe.id) return;
    Alert.alert(
      'Delete recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const recipeId = recipe.id;
              if (!recipeId) {
                return;
              }
              await deleteDoc(doc(db, 'recipes', recipeId));
              setRecipes((prev) => prev.filter((item) => item.id !== recipeId));
            } catch (error) {
              console.error('Failed to delete recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      onPress={() => navigation.navigate('RecipeDetails', { recipeId: item.id! })}
      onEdit={handleEditRecipe}
      onDelete={handleDeleteRecipe}
    />
  );

  const totalLoadedPages = Math.ceil(recipes.length / ITEMS_PER_PAGE);
  const totalPages = Math.max(totalLoadedPages + (hasMore ? 1 : 0), 1);
  const clampedCurrentPage = Math.min(currentPage, totalPages);
  const startPage = Math.max(1, Math.min(clampedCurrentPage - 2, Math.max(totalPages - 4, 1)));
  const endPage = Math.min(totalPages, startPage + 4);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  const displayedRecipes = recipes.slice(
    (clampedCurrentPage - 1) * ITEMS_PER_PAGE,
    clampedCurrentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage !== clampedCurrentPage) {
      setCurrentPage(clampedCurrentPage);
    }
  }, [currentPage, clampedCurrentPage]);

  useEffect(() => {
    if (clampedCurrentPage > totalLoadedPages && hasMore && !loading) {
      loadRecipes();
    }
  }, [clampedCurrentPage, totalLoadedPages, hasMore, loading, loadRecipes]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isPhone && styles.headerPhone, { paddingTop: insets.top + 24 }]}>
        {isPhone ? (
          <>
            <View style={styles.phoneTopRow}>
              <Image source={{ uri: logoUrl }} style={styles.logoFullImage} resizeMode="contain" />
              <View style={styles.phoneActions}>
            <TouchableOpacity
              style={[styles.newPostButton, styles.newPostButtonPhoneIcon]}
              onPress={() => navigation.navigate('NewRecipe')}
            >
                  <View style={styles.plusIcon}>
                    <View style={styles.plusLineHorizontal} />
                    <View style={styles.plusLineVertical} />
                  </View>
                </TouchableOpacity>
                <View style={[styles.userChipContainer, styles.userChipContainerPhone]}>
                  <TouchableOpacity
                    style={[styles.userChip, styles.userChipPhone]}
                    onPress={() => setShowUserMenu(!showUserMenu)}
                  >
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, styles.userNamePhone]} numberOfLines={1}>
                        {userData ? `${userData.firstName} ${userData.lastName}` : 'Guest'}
                      </Text>
                    </View>
                    <View style={styles.chevronDown} />
                  </TouchableOpacity>
                  {showUserMenu && (
                    <View style={styles.userMenu}>
                      <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={styles.logoutIcon} />
                        <Text style={styles.menuItemText}>Log out</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.phoneSearchWrapper}>
              <View style={[styles.searchBox, styles.searchBoxPhone]}>
                <View style={styles.searchIcon}>
                  <View style={styles.searchIconCircle} />
                  <View style={styles.searchIconHandle} />
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="rgba(235,220,209,0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Image source={{ uri: logoUrl }} style={styles.logoFullImage} resizeMode="contain" />
              <View style={styles.searchBox}>
                <View style={styles.searchIcon}>
                  <View style={styles.searchIconCircle} />
                  <View style={styles.searchIconHandle} />
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="rgba(235,220,209,0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.userChipContainer}>
                <TouchableOpacity
                  style={[styles.userChip, styles.userChipDesktop]}
                  onPress={() => setShowUserMenu(!showUserMenu)}
                >
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {userData ? `${userData.firstName} ${userData.lastName}` : 'Guest'}
                    </Text>
                    <Text style={styles.userRole}>Food Lover</Text>
                  </View>
                  <View style={styles.chevronDown} />
                </TouchableOpacity>
                {showUserMenu && (
                  <View style={styles.userMenu}>
                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                      <View style={styles.logoutIcon} />
                      <Text style={styles.menuItemText}>Log out</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.newPostButton}
                onPress={() => navigation.navigate('NewRecipe')}
              >
                <View style={styles.plusIcon}>
                  <View style={styles.plusLineHorizontal} />
                  <View style={styles.plusLineVertical} />
                </View>
                <Text style={styles.newPostButtonText}>New post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.mainContent}>
        {screenWidth > 768 && (
          <ScrollView style={styles.sidebarContainer} showsVerticalScrollIndicator={false}>
            <SidebarFilters
              categories={CATEGORIES}
              prepTimeFilters={PREP_TIME_FILTERS}
              currentFilters={filters}
              onFiltersChange={handleFilterChange}
            />
          </ScrollView>
        )}
        <View style={styles.contentArea}>
          <View style={styles.resultsHeader}>
            <View style={styles.resultsTitleContainer}>
              <Text style={styles.resultsTitle}>Recipes</Text>
              <Text style={styles.resultsCount}>{recipes.length} recipes found</Text>
            </View>
          </View>

          {loading && recipes.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <>
              <FlatList
                data={displayedRecipes}
                renderItem={renderRecipe}
                keyExtractor={(item) => item.id || Math.random().toString()}
                numColumns={numColumns}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={() => loadRecipes(true)} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No recipes found</Text>
                  </View>
                }
              />
              <View style={styles.pagination}>
                {pages.map((page) => (
                  <TouchableOpacity
                    key={page}
                    style={[
                      styles.pageButton,
                      clampedCurrentPage === page && styles.pageButtonActive,
                    ]}
                    onPress={() => setCurrentPage(page)}
                  >
                    <Text
                      style={[
                        styles.pageButtonText,
                        clampedCurrentPage === page && styles.pageButtonTextActive,
                      ]}
                    >
                      {page}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(230,221,214,0.2)',
  },
  headerPhone: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  headerRowPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flex: 1,
  },
  headerLeftPhone: {
    width: '100%',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerRightPhone: {
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  phoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  phoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneSearchWrapper: {
    width: '100%',
    marginTop: 16,
  },
  logoFullImage: {
    width: 184,
    height: 32,
  },
  searchBox: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(230,221,214,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchBoxPhone: {
    width: '100%',
    height: 40,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E5DDD7',
  },
  searchIconHandle: {
    position: 'absolute',
    width: 8,
    height: 1.5,
    backgroundColor: '#E5DDD7',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
    right: 4,
    bottom: 4,
  },
  searchInput: {
    flex: 1,
    color: 'rgba(235,220,209,0.9)',
    fontSize: 16,
    lineHeight: 24,
    height: '100%',
    paddingVertical: 0,
  },
  bellButton: {
    width: 24,
    height: 24,
  },
  bellIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDome: {
    width: 16,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#E5DDD7',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomWidth: 0,
  },
  bellClapper: {
    width: 6,
    height: 3,
    backgroundColor: '#E5DDD7',
    borderRadius: 2,
    marginTop: 2,
  },
  userChipContainer: {
    position: 'relative',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 4,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(230,216,214,0.2)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  userChipDesktop: {
    minWidth: 242,
  },
  userChipPhone: {
    minWidth: undefined,
    flex: 1,
    gap: 8,
    paddingRight: 8,
    height: 44,
    paddingVertical: 4,
    flexShrink: 1,
  },
  userChipContainerPhone: {
    flex: 1,
    maxWidth: 160,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#E6D8D6',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  userNamePhone: {
    fontSize: 14,
    lineHeight: 20,
  },
  userRole: {
    color: 'rgba(230,216,214,0.62)',
    fontSize: 12,
    lineHeight: 16,
  },
  chevronDown: {
    width: 24,
    height: 24,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  userMenu: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 242,
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 4,
    gap: 4,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
    borderRadius: 4,
  },
  logoutIcon: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#2D2726',
  },
  menuItemText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#2D2726',
    flex: 1,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  newPostButtonPhone: {
    paddingHorizontal: 12,
    height: 40,
    alignSelf: 'flex-end',
  },
  newPostButtonPhoneIcon: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  plusIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLineHorizontal: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: '#0D0702',
    borderRadius: 1,
  },
  plusLineVertical: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: '#0D0702',
    borderRadius: 1,
  },
  newPostButtonText: {
    color: '#0D0702',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 24,
  },
  sidebarContainer: {
    width: 240,
  },
  contentArea: {
    flex: 1,
    paddingVertical: 24,
    gap: 32,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  resultsTitleContainer: {
    gap: 4,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.5)',
  },
  listContent: {
    gap: 32,
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
    color: 'rgba(230,216,214,0.62)',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  pageButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  pageButtonActive: {
    backgroundColor: colors.accent,
  },
  pageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    color: 'rgba(230,216,214,0.62)',
    textAlign: 'center',
  },
  pageButtonTextActive: {
    color: '#0D0402',
  },
});
