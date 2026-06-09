import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TAGS } from '../../constants/data';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Props { tagIds: string[]; onPress?: (id: string) => void }

export function TagChips({ tagIds, onPress }: Props) {
  if (!tagIds.length) return null;
  return (
    <View style={styles.row}>
      {tagIds.map(id => {
        const tag = TAGS[id];
        if (!tag) return null;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onPress?.(id)}
            activeOpacity={0.7}
            style={[styles.chip, { backgroundColor: hexToRgba(tag.color, 0.12) }]}
          >
            <Text style={[styles.label, { color: tag.color }]}>{tag.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:  { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  label: { fontSize: 12, fontWeight: '600' },
});
