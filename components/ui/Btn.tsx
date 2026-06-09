import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

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
  sm: { height: 38, fontSize: 14,   paddingHorizontal: 14 },
  md: { height: 48, fontSize: 15.5, paddingHorizontal: 18 },
  lg: { height: 54, fontSize: 16.5, paddingHorizontal: 22 },
};

export function Btn({ children, onPress, kind = 'primary', size = 'md', style, disabled }: Props) {
  const colors = useTheme();
  const s = SIZES[size];

  const kindStyles: Record<BtnKind, { bg: string; color: string; borderWidth?: number; borderColor?: string }> = {
    primary: { bg: colors.accent,    color: '#fff' },
    dark:    { bg: colors.ink,       color: '#fff' },
    soft:    { bg: colors.accentSoft, color: colors.accentInk },
    ghost:   { bg: colors.surface2,  color: colors.ink },
    outline: { bg: 'transparent',    color: colors.ink, borderWidth: 1.5, borderColor: colors.lineStrong },
  };

  const k = kindStyles[kind];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: k.bg,
          borderWidth: k.borderWidth ?? 0,
          borderColor: k.borderColor ?? 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
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
