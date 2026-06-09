import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/tokens';
import type { DueStatus, DueTone } from '../../store/types';

const TONES: Record<DueTone, { bg: string; fg: string }> = {
  danger:  { bg: Colors.dangerSoft, fg: Colors.dangerInk },
  warn:    { bg: Colors.warnSoft,   fg: Colors.warnInk   },
  soon:    { bg: Colors.accentSoft, fg: Colors.accentInk },
  neutral: { bg: Colors.surface2,   fg: Colors.ink2      },
  muted:   { bg: 'transparent',     fg: Colors.faint     },
};

interface Props { status: DueStatus; time?: string; size?: 'sm' | 'md' }

export function DueBadge({ status, time, size = 'md' }: Props) {
  const t = TONES[status.tone] ?? TONES.neutral;
  const fs = size === 'sm' ? 11.5 : 12.5;
  const px = size === 'sm' ? 8 : 9;
  const py = size === 'sm' ? 3 : 4;
  const label = [
    status.label,
    status.sub ? `· ${status.sub}` : null,
    time && status.key !== 'overdue' ? `· ${time}` : null,
  ].filter(Boolean).join(' ');

  return (
    <View style={[styles.pill, { backgroundColor: t.bg, paddingHorizontal: px, paddingVertical: py }]}>
      <Text style={[styles.text, { fontSize: fs, color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', borderRadius: 99, flexShrink: 0 },
  text: { fontWeight: '700' },
});
