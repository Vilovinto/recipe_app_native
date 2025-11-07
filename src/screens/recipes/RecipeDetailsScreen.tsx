import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Recipe, RootStackParamList } from '../../types';
import { formatDate } from '../../utils/format';
import { colors } from '../../constants/theme';

type RecipeDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RecipeDetails'>;
type RecipeDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecipeDetails'>;

export const RecipeDetailsScreen: React.FC = () => {
  const route = useRoute<RecipeDetailsScreenRouteProp>();
  const navigation = useNavigation<RecipeDetailsScreenNavigationProp>();
  const { recipeId } = route.params;
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
      if (recipeDoc.exists()) {
        setRecipe({ id: recipeDoc.id, ...recipeDoc.data() } as Recipe);
      } else {
        Alert.alert('Error', 'Recipe not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe || recipe.userId !== user?.uid) {
      return;
    }

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
              await deleteDoc(doc(db, 'recipes', recipeId));
              Alert.alert('Success', 'Recipe deleted');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!recipe) {
    return null;
  }

  const {
    title,
    rating,
    prepTime,
    cuisine,
    category,
    description,
    ingredients,
    instructions,
    image,
    author,
    createdAt,
    userId,
    id,
  } = recipe;
  const canEdit = userId === user?.uid;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}>
            <Text style={styles.circleButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={[styles.circleButton, styles.favoriteCircle]}
              onPress={() => toggleFavorite(id!)}
            >
              <Text style={styles.favoriteIcon}>{isFavorite(id!) ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
            {canEdit && (
              <>
                <TouchableOpacity
                  style={[styles.circleButton, styles.editCircle]}
                  onPress={() => navigation.navigate('NewRecipe', { recipeId: id })}
                >
                  <Text style={styles.editIcon}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.circleButton, styles.deleteCircle]} onPress={handleDelete}>
                  <Text style={styles.deleteIcon}>⌫</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.heroCard}>
          <Image
            source={image ? { uri: image } : { uri: 'https://via.placeholder.com/1200x900?text=Recipe' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBadges}>
            <View style={styles.heroBadgePrimary}>
              <Text style={styles.heroBadgePrimaryText}>{rating.toFixed(1)}</Text>
              <Text style={styles.heroBadgePrimaryLabel}>Rating</Text>
            </View>
            <View style={styles.heroBadgeSecondary}>
              <Text style={styles.heroBadgeSecondaryText}>{prepTime} min</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.categoryText}>
            {[category, cuisine].filter((value) => typeof value === 'string' && value.trim()).join(' • ')}
          </Text>
          <Text style={styles.titleText}>{title}</Text>
          {description ? <Text style={styles.subtitleText}>{description}</Text> : null}
          <View style={styles.metaRow}>
            <View style={styles.authorChip}>
              <View style={styles.authorAvatarPlaceholder}>
                <Text style={styles.authorAvatarText}>{author?.[0] || 'A'}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{author}</Text>
                <Text style={styles.authorRole}>{formatDate(createdAt) || 'Recently'}</Text>
              </View>
            </View>
            <View style={styles.cuisineBadge}>
              <Text style={styles.cuisineBadgeText}>{cuisine}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Ingredients</Text>
          <View style={styles.sectionDivider} />
          {ingredients.map((ingredient, index) => (
            <View key={`${ingredient}-${index}`} style={styles.ingredientRow}>
              <View style={styles.bulletSquare} />
              <Text style={styles.ingredientLabel}>{ingredient}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Instructions</Text>
          <View style={styles.sectionDivider} />
          {instructions.map((instruction, index) => (
            <View key={`${instruction}-${index}`} style={styles.stepRow}>
              <View style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{instruction}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230,216,214,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonText: {
    color: '#F3E9E5',
    fontSize: 18,
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  favoriteCircle: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  favoriteIcon: {
    fontSize: 18,
  },
  editCircle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  editIcon: {
    color: '#F3E9E5',
    fontSize: 16,
  },
  deleteCircle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  deleteIcon: {
    color: '#F3E9E5',
    fontSize: 16,
  },
  heroCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#3B3432',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroBadges: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    flexDirection: 'row',
    gap: 12,
  },
  heroBadgePrimary: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  heroBadgePrimaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D0402',
  },
  heroBadgePrimaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D0402',
    opacity: 0.8,
  },
  heroBadgeSecondary: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D0402',
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  titleText: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    color: '#F3E9E5',
  },
  subtitleText: {
    fontSize: 18,
    lineHeight: 26,
    color: 'rgba(243,233,229,0.72)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3E9E5',
  },
  authorRole: {
    fontSize: 13,
    color: 'rgba(243,233,229,0.6)',
  },
  cuisineBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(230,216,214,0.2)',
  },
  cuisineBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3E9E5',
  },
  sectionCard: {
    marginTop: 28,
    marginHorizontal: 24,
    backgroundColor: '#3B3432',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(230,216,214,0.08)',
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F3E9E5',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(230,216,214,0.16)',
    marginTop: 12,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  bulletSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(230,216,214,0.35)',
  },
  ingredientLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#F3E9E5',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
  },
  stepIndex: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    fontWeight: '700',
    color: '#0D0402',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#F3E9E5',
  },
});

