import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RecipeFilters } from '../types';
import { colors } from '../constants/theme';

interface SidebarFiltersProps {
  categories: readonly string[];
  prepTimeFilters: readonly { label: string; value: string }[];
  currentFilters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  categories,
  prepTimeFilters,
  currentFilters,
  onFiltersChange,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters.category ? [currentFilters.category] : []
  );
  const [selectedPrepTime, setSelectedPrepTime] = useState<string>(
    currentFilters.prepTime || ''
  );

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    onFiltersChange({
      ...currentFilters,
      category: newCategories.length > 0 ? newCategories[0] : undefined,
    });
  };

  const selectPrepTime = (value: string) => {
    setSelectedPrepTime(value);
    onFiltersChange({
      ...currentFilters,
      prepTime: value || undefined,
    });
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Filter by Category</Text>
        <View style={styles.checkboxes}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.checkboxRow}
              onPress={() => toggleCategory(category)}
            >
              <View style={[styles.checkbox, selectedCategories.includes(category) && styles.checkboxChecked]}>
                {selectedCategories.includes(category) && <View style={styles.checkmark} />}
              </View>
              <Text style={styles.checkboxLabel}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.divider} />
      </View>

      <View style={styles.prepTimeSection}>
        <Text style={styles.sectionTitle}>Filter by Prep Time</Text>
        <View style={styles.radios}>
          {prepTimeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={styles.radioRow}
              onPress={() => selectPrepTime(filter.value)}
            >
              <View style={[styles.radio, selectedPrepTime === filter.value && styles.radioSelected]}>
                {selectedPrepTime === filter.value && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.divider} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.background,
  },
  categorySection: {
    paddingVertical: 24,
    gap: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 27,
    color: '#E6D8D6',
  },
  checkboxes: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: '#E6D8D6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: '#0D0402',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: '#E6D8D6',
    flex: 1,
  },
  prepTimeSection: {
    paddingVertical: 24,
    paddingBottom: 32,
    gap: 24,
  },
  radios: {
    gap: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radio: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: '#E6D8D6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 12,
    height: 12,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: '#E6D8D6',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(182,160,145,0.2)',
  },
});

