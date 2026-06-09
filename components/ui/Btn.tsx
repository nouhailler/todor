import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/tokens';

type BtnKind = 'primary' | 'dark' | 'soft' | 'ghost' | 'outline';
type BtnSize = 'sm' | 'md' | 'lg';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  kind?: BtnKind;
  size?: BtnSize;
  style?: ViewStyle;
  disabled?: boolean;
}

const SIZES = {
  sm: { height: 38, fontSize: 14, paddingHorizontal: 14 },
  md: { height: 48, fontSize: 15.5, paddingHorizontal: 18 },
  lg: { height: 54, fontSize: 16.5, paddingHorizontal: 22 },
};

const KINDS: Record<BtnKind, { backgroundColor: string; color: string; borderWidth?: number; borderColor?: string }> = {
  primary: { backgroundColor: Colors.accent,     color: '#fff' },
  dark:    { backgroundColor: Colors.ink,         color: '#fff' },
  soft:    { backgroundColor: Colors.accentSoft,  color: Colors.accentInk },
  ghost:   { backgroundColor: Colors.surface2,    color: Colors.ink },
  outline: { backgroundColor: 'transparent',      color: Colors.ink, borderWidth: 1.5, borderColor: Colors.lineStrong },
};

export function Btn({ children, onPress, kind = 'primary', size = 'md', style, disabled }: Props) {
  const s = SIZES[size];
  const k = KINDS[kind];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        { height: s.height, paddingHorizontal: s.paddingHorizontal, backgroundColor: k.backgroundColor,
          borderWidth: k.borderWidth ?? 0, borderColor: k.borderColor ?? 'transparent',
          opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { fontSize: s.fontSize, color: k.color }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:  { borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontWeight: '600' },
});
