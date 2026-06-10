import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Btn } from '../ui/Btn';
import { Colors, Radius, Space } from '../../constants/tokens';

const PHOTO_SUGGEST = [
  { id: 'p1', text: 'Lait',         detail: 'presque vide',  on: true  },
  { id: 'p2', text: 'Œufs',         detail: '2 restants',    on: true  },
  { id: 'p3', text: "Jus d'orange", detail: 'terminé',       on: true  },
  { id: 'p4', text: 'Yaourts',      detail: 'à compléter',   on: false },
  { id: 'p5', text: 'Beurre',       detail: 'entamé',        on: false },
];

type Phase = 'scan' | 'result';

export interface PhotoItem { text: string; cat: string }

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: PhotoItem[]) => void;
}

// Fridge shelf row of colored blocks
function ShelfRow({ row }: { row: number }) {
  const colors = ['#e9e2d3', '#cd6b58', '#e4c074', '#8fb0a0'];
  return (
    <View style={styles.shelfRow}>
      {[0, 1, 2, 3].map(c => (
        <View
          key={c}
          style={[
            styles.shelfItem,
            {
              width: 26 + (c * 4) % 14,
              height: 30 + (row * 5) % 18,
              backgroundColor: colors[(row + c) % 4],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ScanLine({ active }: { active: boolean }) {
  const pos = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pos, { toValue: 1, duration: 1100, useNativeDriver: false }),
        Animated.timing(pos, { toValue: 0, duration: 0,    useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);

  if (!active) return null;
  return (
    <Animated.View
      style={[
        styles.scanLine,
        { top: pos.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
      ]}
    />
  );
}

function ThinkingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600 - i * 160),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={styles.dotsRow}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
      ))}
    </View>
  );
}

export function PhotoSheet({ open, onClose, onConfirm }: Props) {
  const [phase, setPhase] = useState<Phase>('scan');
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setPhase('scan');
    setPicked(Object.fromEntries(PHOTO_SUGGEST.map(s => [s.id, s.on])));
    const t = setTimeout(() => setPhase('result'), 2200);
    return () => clearTimeout(t);
  }, [open]);

  const toggle = (id: string) => setPicked(p => ({ ...p, [id]: !p[id] }));
  const count = Object.values(picked).filter(Boolean).length;

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {phase === 'scan' ? 'Analyse de la photo' : 'À racheter'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: Colors.ink2 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Fake fridge photo */}
      <View style={styles.photo}>
        <View style={styles.photoContent}>
          {[0, 1, 2].map(r => <ShelfRow key={r} row={r} />)}
        </View>
        {/* Label overlay */}
        <View style={styles.photoLabel}>
          <Text style={styles.photoLabelText}>📷 Frigo · maintenant</Text>
        </View>
        {/* Scan effect */}
        <ScanLine active={phase === 'scan'} />
        {phase === 'scan' && <View style={styles.scanOverlay} />}
      </View>

      {phase === 'scan' ? (
        <View style={styles.scanStatus}>
          <ThinkingDots />
          <Text style={styles.scanStatusText}>L'assistant repère ce qui manque…</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {/* Banner */}
          <View style={styles.banner}>
            <Text style={{ fontSize: 15 }}>✨</Text>
            <Text style={styles.bannerText}>
              {PHOTO_SUGGEST.length} produits détectés comme bas ou vides.
            </Text>
          </View>

          {/* Pill toggles */}
          <View style={styles.pillsRow}>
            {PHOTO_SUGGEST.map(s => (
              <TouchableOpacity
                key={s.id}
                onPress={() => toggle(s.id)}
                activeOpacity={0.75}
                style={[
                  styles.pill,
                  picked[s.id] && styles.pillOn,
                ]}
              >
                <Text style={[styles.pillIcon, picked[s.id] && { color: '#fff' }]}>
                  {picked[s.id] ? '✓' : '+'}
                </Text>
                <Text style={[styles.pillText, picked[s.id] && { color: '#fff' }]}>
                  {s.text}
                </Text>
                <Text style={[styles.pillDetail, picked[s.id] && { color: 'rgba(255,255,255,0.75)' }]}>
                  · {s.detail}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Btn
            kind="primary"
            size="lg"
            onPress={() => onConfirm(PHOTO_SUGGEST.filter(s => picked[s.id]).map(s => ({ text: s.text, cat: 'Frais' })))}
            style={{ marginTop: 16 }}
          >
            {`+ Ajouter ${count} article${count > 1 ? 's' : ''}`}
          </Btn>
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink },
  closeBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },

  photo:        { height: 180, borderRadius: 18, overflow: 'hidden', marginBottom: 14, backgroundColor: '#dfe7e3' },
  photoContent: { flex: 1, justifyContent: 'space-evenly', padding: 14, paddingHorizontal: 18 },
  shelfRow:     { flexDirection: 'row', gap: 10, borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.45)', paddingBottom: 10 },
  shelfItem:    { borderRadius: 5, opacity: 0.85 },
  photoLabel:   { position: 'absolute', top: 10, left: 12, backgroundColor: 'rgba(20,19,14,0.4)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 },
  photoLabelText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },

  scanLine:    { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: Colors.accent, opacity: 0.9 },
  scanOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(27,154,92,0.06)' },

  scanStatus:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  dotsRow:        { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot:            { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.accent },
  scanStatusText: { fontSize: 13.5, fontWeight: '600', color: Colors.muted },

  banner:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.accentSoft, borderRadius: 12, padding: 12, marginBottom: 12 },
  bannerText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: Colors.accentInk },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.lineStrong },
  pillOn:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillIcon: { fontSize: 14, fontWeight: '700', color: Colors.ink2 },
  pillText: { fontSize: 14.5, fontWeight: '600', color: Colors.ink },
  pillDetail: { fontSize: 11.5, color: Colors.muted },
});
