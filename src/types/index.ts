export interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  category: string;
  cuisine: string;
  prepTime: number;
  rating: number;
  ingredients: string[];
  instructions: string[];
  image: string;
  author: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface RecipeFilters {
  category?: string;
  prepTime?: string;
  searchQuery?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Main: undefined;
  Recipes: undefined;
  RecipeDetails: { recipeId: string };
  NewRecipe: { recipeId?: string } | undefined;
};
