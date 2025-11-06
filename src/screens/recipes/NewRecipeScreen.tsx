import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { Recipe, RootStackParamList } from '../../types';
import { CATEGORIES, CUISINES } from '../../constants/recipes';

type NewRecipeScreenRouteProp = RouteProp<RootStackParamList, 'NewRecipe'>;
type NewRecipeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewRecipe'>;

// moved to constants

export const NewRecipeScreen: React.FC = () => {
  const route = useRoute<NewRecipeScreenRouteProp>();
  const navigation = useNavigation<NewRecipeScreenNavigationProp>();
  const { recipeId } = route.params || {};
  const { user, userData } = useAuth();
  const isEditMode = !!recipeId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [rating, setRating] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && recipeId) {
      loadRecipe();
    }
  }, [recipeId, isEditMode]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const recipeDoc = await getDoc(doc(db, 'recipes', recipeId!));
      if (recipeDoc.exists()) {
        const data = recipeDoc.data() as Recipe;
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setCuisine(data.cuisine);
        setPrepTime(data.prepTime.toString());
        setRating(data.rating.toString());
        setIngredients(data.ingredients.length > 0 ? data.ingredients : ['']);
        setInstructions(data.instructions.length > 0 ? data.instructions : ['']);
        setImageUri(data.image || null);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0]) {
          setImageUri(response.assets[0].uri || null);
        }
      }
    );
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri || !user) return null;

    try {
      setUploading(true);
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageRef = ref(storage, `recipes/${user.uid}/${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !description || !category || !cuisine || !prepTime || !rating) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.trim());
    const validInstructions = instructions.filter((inst) => inst.trim());

    if (validIngredients.length === 0 || validInstructions.length === 0) {
      Alert.alert('Error', 'Add at least one ingredient and instruction');
      return;
    }

    try {
      setLoading(true);
      let imageUrl = imageUri;

      if (imageUri && imageUri.startsWith('file://')) {
        imageUrl = await uploadImage();
      }

      const recipeData: Omit<Recipe, 'id'> = {
        title,
        description,
        category,
        cuisine,
        prepTime: parseInt(prepTime, 10),
        rating: parseFloat(rating),
        ingredients: validIngredients,
        instructions: validInstructions,
        image: imageUrl || '',
        author: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown',
        userId: user!.uid,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode && recipeId) {
        await setDoc(doc(db, 'recipes', recipeId), recipeData, { merge: true });
        Alert.alert('Success', 'Recipe updated');
      } else {
        recipeData.createdAt = serverTimestamp();
        const newRecipeRef = doc(db, 'recipes', '');
        await setDoc(newRecipeRef, recipeData);
        Alert.alert('Success', 'Recipe created');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  if (loading && isEditMode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit recipe' : 'New recipe'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || uploading}
          style={[styles.saveButton, (loading || uploading) && styles.saveButtonDisabled]}
        >
          {loading || uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>+ Add image</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Recipe title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Cuisine</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {CUISINES.map((cui) => (
                  <TouchableOpacity
                    key={cui}
                    style={[styles.chip, cuisine === cui && styles.chipActive]}
                    onPress={() => setCuisine(cui)}
                  >
                    <Text style={[styles.chipText, cuisine === cui && styles.chipTextActive]}>
                      {cui}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Prep time (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="60"
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Rating</Text>
            <TextInput
              style={styles.input}
              placeholder="4.5"
              value={rating}
              onChangeText={setRating}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <TouchableOpacity onPress={addIngredient}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <TextInput
                style={[styles.input, styles.listInput]}
                placeholder={`Ingredient ${index + 1}`}
                value={ingredient}
                onChangeText={(value) => updateIngredient(index, value)}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <TouchableOpacity onPress={addInstruction}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.instructionNumber}>{index + 1}.</Text>
              <TextInput
                style={[styles.input, styles.listInput, styles.instructionInput]}
                placeholder={`Step ${index + 1}`}
                value={instruction}
                onChangeText={(value) => updateInstruction(index, value)}
                multiline
              />
              {instructions.length > 1 && (
                <TouchableOpacity onPress={() => removeInstruction(index)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  form: {
    padding: 16,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  instructionNumber: {
    width: 24,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
  },
  instructionInput: {
    flex: 1,
  },
  removeButton: {
    fontSize: 20,
    color: '#f44336',
    fontWeight: 'bold',
  },
});

