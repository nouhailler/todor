import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Btn } from '../ui/Btn';
import { Colors, Radius, Space } from '../../constants/tokens';

const VOICE_SCRIPT = {
  heard: "Ajoute six œufs et une plaquette de beurre, et rappelle-moi de réserver le resto vendredi soir",
  parsed: [
    { id: 'v1', text: 'Œufs ×6',           cat: 'Frais',  kind: 'item' as const,  meta: undefined },
    { id: 'v2', text: 'Plaquette de beurre', cat: 'Frais',  kind: 'item' as const,  meta: undefined },
    { id: 'v3', text: 'Réserver le resto',   cat: 'À faire', kind: 'task' as const, meta: 'Vendredi · 20:00' },
  ],
};

type Phase = 'listening' | 'thinking' | 'result';

export interface ParsedItem { id: string; text: string; cat: string; kind: 'item' | 'task'; meta?: string }

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: ParsedItem[]) => void;
}

function WaveBar({ index, playing }: { index: number; playing: boolean }) {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (!playing) { anim.setValue(0.35); return; }
    const dur = 500 + (index % 5) * 120;
    const delay = index * 40;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: dur, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [playing]);
  return (
    <Animated.View
      style={[styles.wavebar, { transform: [{ scaleY: anim }] }]}
    />
  );
}

function ThinkingDots() {
  const dots = Array.from({ length: 3 }, () => useRef(new Animated.Value(0)).current);
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

export function VoiceSheet({ open, onClose, onConfirm }: Props) {
  const [phase, setPhase] = useState<Phase>('listening');
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setPhase('listening');
    setTyped('');
    setPicked(Object.fromEntries(VOICE_SCRIPT.parsed.map(p => [p.id, true])));

    let i = 0;
    const full = VOICE_SCRIPT.heard;
    const typer = setInterval(() => {
      i += 2;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(typer);
        setTimeout(() => setPhase('thinking'), 450);
      }
    }, 32);
    return () => clearInterval(typer);
  }, [open]);

  useEffect(() => {
    if (phase !== 'thinking') return;
    const t = setTimeout(() => setPhase('result'), 1300);
    return () => clearTimeout(t);
  }, [phase]);

  const toggle = (id: string) => setPicked(p => ({ ...p, [id]: !p[id] }));
  const confirmCount = Object.values(picked).filter(Boolean).length;

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {phase === 'result' ? 'Prêt à ajouter' : 'Dicte ta liste'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: Colors.ink2 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {phase !== 'result' && (
        <View style={styles.listenWrap}>
          {/* Mic orb */}
          <View style={styles.orbWrap}>
            <View style={styles.orbPulse} />
            <View style={styles.orb}>
              <Text style={{ fontSize: 30 }}>🎙</Text>
            </View>
          </View>

          {/* Waveform */}
          <View style={styles.waveform}>
            {Array.from({ length: 22 }).map((_, i) => (
              <WaveBar key={i} index={i} playing={phase === 'listening'} />
            ))}
          </View>

          {/* Transcription */}
          <Text style={styles.transcript}>
            {typed}
            {phase === 'listening' && <Text style={{ color: Colors.accent }}>|</Text>}
          </Text>

          {phase === 'thinking' && (
            <View style={styles.thinkingRow}>
              <ThinkingDots />
              <Text style={styles.thinkingText}>L'assistant organise ta dictée…</Text>
            </View>
          )}
        </View>
      )}

      {phase === 'result' && (
        <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <View style={styles.banner}>
            <Text style={{ fontSize: 15 }}>✨</Text>
            <Text style={styles.bannerText}>
              J'ai reconnu {VOICE_SCRIPT.parsed.length} éléments — décoche ce que tu ne veux pas.
            </Text>
          </View>

          {/* Items */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {VOICE_SCRIPT.parsed.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => toggle(p.id)}
                style={styles.itemRow}
                activeOpacity={0.8}
              >
                {/* Checkbox */}
                <View style={[styles.checkbox, picked[p.id] && { backgroundColor: Colors.accent, borderWidth: 0 }]}>
                  {picked[p.id] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.itemText}>{p.text}</Text>
                  <View style={styles.itemMeta}>
                    <View style={styles.catChip}>
                      <Text style={styles.catText}>{p.cat}</Text>
                    </View>
                    {p.meta && (
                      <Text style={styles.metaText}>🕐 {p.meta}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Btn
            kind="primary"
            size="lg"
            onPress={() => onConfirm(VOICE_SCRIPT.parsed.filter(p => picked[p.id]))}
            style={{ marginTop: 16 }}
          >
            {`+ Ajouter ${confirmCount} élément${confirmCount > 1 ? 's' : ''}`}
          </Btn>
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink },
  closeBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },

  listenWrap:  { alignItems: 'center', paddingVertical: 18, gap: 16 },

  orbWrap:  { position: 'relative', width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  orbPulse: { position: 'absolute', inset: 0, borderRadius: 48, backgroundColor: Colors.accentSoft },
  orb:      { position: 'absolute', width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },

  waveform: { flexDirection: 'row', gap: 3.5, height: 30, alignItems: 'center' },
  wavebar:  { width: 3.5, height: 22, borderRadius: 99, backgroundColor: Colors.accent, opacity: 0.85 },

  transcript:   { fontSize: 16, lineHeight: 24, textAlign: 'center', color: Colors.ink2, minHeight: 70, paddingHorizontal: 6 },

  thinkingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotsRow:      { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot:          { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.accent },
  thinkingText: { fontSize: 13.5, fontWeight: '600', color: Colors.muted },

  banner:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.accentSoft, borderRadius: 12, padding: 12, marginBottom: 2 },
  bannerText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: Colors.accentInk },

  itemRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, borderRadius: 14, padding: 14 },
  checkbox:  { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: Colors.lineStrong, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemText:  { fontSize: 15.5, fontWeight: '600', color: Colors.ink },
  itemMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catChip:   { backgroundColor: Colors.surface2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  catText:   { fontSize: 12, fontWeight: '600', color: Colors.muted },
  metaText:  { fontSize: 12, fontWeight: '600', color: Colors.muted },
});
