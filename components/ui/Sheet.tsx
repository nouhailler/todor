import React, { useState, useEffect } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/tokens';

const SCREEN_H = Dimensions.get('window').height;
const SHEET_MAX = SCREEN_H * 0.88;

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dark?: boolean;
}

export function Sheet({ open, onClose, children, dark = false }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);

  const translateY  = useSharedValue(SHEET_MAX);
  const scrimAlpha  = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    if (open) {
      scrimAlpha.value  = withTiming(1, { duration: 250, easing: Easing.ease });
      translateY.value  = withTiming(0, { duration: 340, easing: Easing.bezier(0.2, 0.8, 0.25, 1) });
    } else {
      scrimAlpha.value  = withTiming(0, { duration: 220, easing: Easing.ease });
      translateY.value  = withTiming(SHEET_MAX, { duration: 280, easing: Easing.in(Easing.quad) },
        (finished) => { if (finished) runOnJS(setMounted)(false); }
      );
    }
  }, [open, mounted]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimAlpha.value,
  }));

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Scrim — purely visual, pointerEvents none so it never blocks the panel */}
        <Animated.View style={[styles.scrim, scrimStyle]} pointerEvents="none" />
        {/* Tap-to-close zone — only fills the space above the panel */}
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={[
            styles.panel,
            { backgroundColor: dark ? Colors.ink : Colors.surface, paddingBottom: insets.bottom + 20 },
            panelStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: dark ? 'rgba(255,255,255,0.2)' : Colors.lineStrong }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim:   { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,19,14,0.34)' },
  panel:   {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: SHEET_MAX,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  handle: { width: 38, height: 4.5, borderRadius: 99, alignSelf: 'center', marginBottom: 14 },
});
