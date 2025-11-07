import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Recipe } from '../types';
import { colors } from '../constants/theme';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress, onEdit, onDelete }) => {
  const { image, title, description, cuisine, rating, prepTime } = recipe;
  const [menuVisible, setMenuVisible] = useState(false);

  const prepTimeLabel = prepTime >= 120
    ? '2 hrs'
    : prepTime >= 90
      ? '1.5 hrs'
      : prepTime >= 60
        ? '1 hr'
        : `${prepTime} min`;

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    onEdit?.(recipe);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete?.(recipe);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={image ? { uri: image } : { uri: 'https://via.placeholder.com/300x200?text=Recipe' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <View style={styles.infoRow}>
          <View style={styles.textBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {!!description && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {description}
              </Text>
            )}
            <Text style={styles.cuisine}>{cuisine}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{prepTimeLabel}</Text>
          </View>
          <View style={styles.menuWrapper}>
            <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
              <View style={styles.menuDot} />
              <View style={[styles.menuDot, styles.menuDotMiddle]} />
              <View style={styles.menuDot} />
            </TouchableOpacity>
            {menuVisible && (
              <View style={styles.menuPopover}>
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <Text style={styles.menuItemText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#3B3432',
    borderRadius: 16,
    margin: 8,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(230,216,214,0.12)',
  },
  image: {
    width: '100%',
    height: 164,
  },
  body: {
    padding: 16,
    gap: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#F3E9E5',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(243,233,229,0.72)',
  },
  cuisine: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: 'rgba(243,233,229,0.72)',
  },
  ratingBadge: {
    width: 36,
    height: 36,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0402',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  timeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D0402',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(182,160,145,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  menuWrapper: {
    position: 'relative',
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(243,233,229,0.72)',
  },
  menuDotMiddle: {
    opacity: 0.6,
  },
  menuPopover: {
    position: 'absolute',
    right: 0,
    top: -78,
    width: 120,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 6,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D2726',
  },
});
