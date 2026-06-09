import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Member } from '../../store/types';

interface Props { m: Member; size?: number; ring?: boolean }

export function Avatar({ m, size = 28, ring = false }: Props) {
  return (
    <View style={[
      styles.base,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: m.color },
      ring && { borderWidth: 2, borderColor: '#FBFAF6' },
    ]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{m.initials}</Text>
    </View>
  );
}

interface StackProps { ids: string[]; members: Record<string, Member>; size?: number }

export function AvatarStack({ ids, members, size = 24 }: StackProps) {
  return (
    <View style={styles.stack}>
      {ids.map((id, i) => (
        <View key={id} style={{ marginLeft: i === 0 ? 0 : -(size * 0.32), zIndex: ids.length - i }}>
          <Avatar m={members[id]} size={size} ring />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base:     { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initials: { color: '#fff', fontWeight: '600' },
  stack:    { flexDirection: 'row', alignItems: 'center' },
});
