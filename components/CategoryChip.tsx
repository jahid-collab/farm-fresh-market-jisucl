
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Category } from '@/types/Product';
import { colors } from '@/styles/commonStyles';

interface CategoryChipProps {
  category: Category;
  isSelected?: boolean;
  onPress?: (category: Category) => void;
}

export default function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
  const handlePress = () => {
    console.log('Category selected:', category.name);
    if (onPress) {
      onPress(category);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{category.emoji}</Text>
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: colors.highlight,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 18,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primary,
  },
});
