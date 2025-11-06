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
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
      if (recipeDoc.exists()) {
        setRecipe({ id: recipeDoc.id, ...recipeDoc.data() } as Recipe);
      } else {
        Alert.alert('Помилка', 'Рецепт не знайдено');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити рецепт');
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

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
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

  const { title, rating, prepTime, cuisine, description, ingredients, instructions, image, author, createdAt, userId, id } = recipe;
  const canEdit = userId === user?.uid;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Image
        source={image ? { uri: image } : { uri: 'https://via.placeholder.com/400x300?text=Recipe' }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(id!)}
            >
              <Text style={styles.favoriteButtonText}>
                {isFavorite(id!) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
            {canEdit && (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('NewRecipe' as never, { recipeId: id } as never)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={styles.author}>{author}</Text>
          <Text style={styles.date}>{formatDate(createdAt) || 'Recently'}</Text>
        </View>

        <View style={styles.ratings}>
          <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>
          <Text style={styles.prepTime}>⏱ {prepTime} min</Text>
          <Text style={styles.cuisine}>{cuisine}</Text>
        </View>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredients.map((ingredient, index) => (
            <TouchableOpacity
              key={index}
              style={styles.ingredientItem}
              onPress={() => toggleIngredient(index)}
            >
              <View
                style={[
                  styles.checkbox,
                  checkedIngredients.has(index) && styles.checkboxChecked,
                ]}
              >
                {checkedIngredients.has(index) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.ingredientText,
                  checkedIngredients.has(index) && styles.ingredientTextChecked,
                ]}
              >
                {ingredient}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteButtonText: {
    fontSize: 24,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f44336',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  author: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  ratings: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  rating: {
    fontSize: 16,
    color: '#333',
  },
  prepTime: {
    fontSize: 16,
    color: '#333',
  },
  cuisine: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

