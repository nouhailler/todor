import React from 'react';
import { View } from 'react-native';
import { PRIORITIES } from '../../constants/data';

interface Props { priority: number }

export function PriorityBar({ priority }: Props) {
  if (!priority || priority < 4) return null;
  const color = PRIORITIES[priority]?.color ?? '#B6B2A6';
  return (
    <View style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 4, borderRadius: 99, backgroundColor: color }} />
  );
}
