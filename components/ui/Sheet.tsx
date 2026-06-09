import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dark?: boolean;
}

export function Sheet({ open, onClose, children, dark = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[
          styles.panel,
          { backgroundColor: dark ? Colors.ink : Colors.surface, paddingBottom: insets.bottom + 20 },
        ]}>
          <View style={[styles.handle, { backgroundColor: dark ? 'rgba(255,255,255,0.2)' : Colors.lineStrong }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim:   { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,19,14,0.34)' },
  panel:   {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: Dimensions.get('window').height * 0.88,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  handle: { width: 38, height: 4.5, borderRadius: 99, alignSelf: 'center', marginBottom: 14 },
});
