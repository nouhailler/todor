import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/tokens';

interface Props {
  value: number;
  total: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function Progress({ value, total, color, height = 7, showLabel = false }: Props) {
  const colors = useTheme();
  const fillColor = color ?? colors.accent;
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.col}>
      {showLabel && (
        <View style={styles.row}>
          <Text style={styles.labelLeft}>{value} sur {total} faits</Text>
          <Text style={[styles.labelRight, { color: fillColor }]}>{pct}%</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor, height }]} />
      </View>
    </View>
  );
}

interface RingProps { value: number; total: number; size?: number; color?: string }

export function RingProgress({ value, total, size = 44, color }: RingProps) {
  const colors = useTheme();
  const fillColor = color ?? colors.accent;
  const pct = total ? value / total : 0;
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <View style={{ width: size, height: size }}>
      <Text style={[styles.ringPct, { fontSize: size * 0.22, color: fillColor }]}>{Math.round(pct * 100)}%</Text>
      <View style={[styles.ringTrack, { width: size, height: size, borderRadius: size / 2, borderColor: Colors.surface2 }]} />
      <View style={[styles.ringFill, {
        width: size * pct, maxWidth: size,
        borderTopRightRadius: strokeDashoffset < 1 ? size / 2 : 0,
        borderBottomRightRadius: strokeDashoffset < 1 ? size / 2 : 0,
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  col:       { width: '100%', gap: 6 },
  row:       { flexDirection: 'row', justifyContent: 'space-between' },
  labelLeft: { fontSize: 12.5, color: Colors.muted, fontWeight: '600' },
  labelRight:{ fontSize: 12.5, fontWeight: '700' },
  track:     { backgroundColor: Colors.surface2, borderRadius: 99, overflow: 'hidden', width: '100%' },
  fill:      { borderRadius: 99 },
  ringTrack: { position: 'absolute', borderWidth: 5 },
  ringFill:  { position: 'absolute' },
  ringPct:   { position: 'absolute', zIndex: 1, textAlign: 'center', fontWeight: '700', top: '50%', left: 0, right: 0 },
});
