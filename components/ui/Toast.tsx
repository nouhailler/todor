import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/tokens';

interface Props { message: string | null; onHide: () => void }

export function Toast({ message, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  }, [message]);

  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 96, left: 24, right: 24,
    backgroundColor: Colors.ink, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 12,
    alignItems: 'center', zIndex: 9999,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
