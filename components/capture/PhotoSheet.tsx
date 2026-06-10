import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Sheet } from '../ui/Sheet';
import { Btn } from '../ui/Btn';
import { Colors, Radius, Space } from '../../constants/tokens';
import { useVisionProvider, analyzePhoto, type PhotoItem } from '../../lib/vision';

export type { PhotoItem };

// Suggestions de démo utilisées quand aucune clé API n'est configurée (.env)
const PHOTO_SUGGEST = [
  { id: 'p1', text: 'Lait',         detail: 'presque vide',  on: true  },
  { id: 'p2', text: 'Œufs',         detail: '2 restants',    on: true  },
  { id: 'p3', text: "Jus d'orange", detail: 'terminé',       on: true  },
  { id: 'p4', text: 'Yaourts',      detail: 'à compléter',   on: false },
  { id: 'p5', text: 'Beurre',       detail: 'entamé',        on: false },
];

type Phase = 'pick' | 'scan' | 'result';

interface Suggestion { id: string; text: string; detail?: string; on: boolean }

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: PhotoItem[]) => void;
}

// Fridge shelf row of colored blocks (démo sans clé API)
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
  const live = useVisionProvider() !== null;

  const [phase, setPhase] = useState<Phase>('pick');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhotoUri(null);
    setSuggestions([]);
    setPicked({});
    setError(null);

    if (live) {
      setPhase('pick');
      return;
    }

    // Mode démo : frigo factice + scan scripté
    setPhase('scan');
    const t = setTimeout(() => {
      setSuggestions(PHOTO_SUGGEST);
      setPicked(Object.fromEntries(PHOTO_SUGGEST.map(s => [s.id, s.on])));
      setPhase('result');
    }, 2200);
    return () => clearTimeout(t);
  }, [open]);

  const scan = async (base64: string, mime: string | undefined, uri: string) => {
    setError(null);
    setPhotoUri(uri);
    setPhase('scan');
    try {
      const items = await analyzePhoto(base64, mime);
      if (items.length === 0) {
        setError("Aucun article reconnu sur cette photo — réessaie avec un autre cadrage.");
        setPhase('pick');
        return;
      }
      const sugg = items.map((it, i) => ({ id: `s${i}`, text: it.text, detail: it.detail, on: true }));
      setSuggestions(sugg);
      setPicked(Object.fromEntries(sugg.map(s => [s.id, true])));
      setPhase('result');
    } catch (e) {
      setError("L'analyse a échoué — vérifie ta connexion et ta clé API, puis réessaie.");
      setPhase('pick');
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    setError(null);
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Accès à la caméra refusé.');
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', base64: true, quality: 0.6 });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    await scan(asset.base64!, asset.mimeType, asset.uri);
  };

  const toggle = (id: string) => setPicked(p => ({ ...p, [id]: !p[id] }));
  const count = Object.values(picked).filter(Boolean).length;

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {phase === 'pick' ? 'Scanner une photo' : phase === 'scan' ? 'Analyse de la photo' : 'À racheter'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: Colors.ink2 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Choix de la source (mode réel) */}
      {phase === 'pick' && (
        <View style={styles.pickWrap}>
          <Text style={styles.pickHint}>
            Photographie ton frigo, un placard ou une liste manuscrite — l'assistant en extrait les articles.
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {Platform.OS !== 'web' && (
            <Btn kind="primary" size="lg" onPress={() => pickImage(true)}>
              📷 Prendre une photo
            </Btn>
          )}
          <Btn kind={Platform.OS === 'web' ? 'primary' : 'soft'} size="lg" onPress={() => pickImage(false)}>
            🖼 Choisir une image
          </Btn>
        </View>
      )}

      {/* Photo (réelle ou frigo factice en démo) */}
      {phase !== 'pick' && (
        <View style={styles.photo}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={styles.photoContent}>
              {[0, 1, 2].map(r => <ShelfRow key={r} row={r} />)}
            </View>
          )}
          <View style={styles.photoLabel}>
            <Text style={styles.photoLabelText}>📷 {photoUri ? 'Ta photo' : 'Frigo · maintenant'}</Text>
          </View>
          <ScanLine active={phase === 'scan'} />
          {phase === 'scan' && <View style={styles.scanOverlay} />}
        </View>
      )}

      {phase === 'scan' && (
        <View style={styles.scanStatus}>
          <ThinkingDots />
          <Text style={styles.scanStatusText}>L'assistant repère ce qui manque…</Text>
        </View>
      )}

      {phase === 'result' && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {/* Banner */}
          <View style={styles.banner}>
            <Text style={{ fontSize: 15 }}>✨</Text>
            <Text style={styles.bannerText}>
              {suggestions.length} produit{suggestions.length > 1 ? 's' : ''} détecté{suggestions.length > 1 ? 's' : ''} — décoche ce que tu ne veux pas.
            </Text>
          </View>

          {/* Pill toggles */}
          <View style={styles.pillsRow}>
            {suggestions.map(s => (
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
                {!!s.detail && (
                  <Text style={[styles.pillDetail, picked[s.id] && { color: 'rgba(255,255,255,0.75)' }]}>
                    · {s.detail}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Btn
            kind="primary"
            size="lg"
            onPress={() => onConfirm(suggestions.filter(s => picked[s.id]).map(s => ({ text: s.text, cat: 'Frais' })))}
            disabled={count === 0}
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

  pickWrap:  { gap: 12, paddingVertical: 6, paddingBottom: 10 },
  pickHint:  { fontSize: 14, lineHeight: 21, color: Colors.ink2, textAlign: 'center', paddingHorizontal: 8, marginBottom: 4 },
  errorText: { fontSize: 13.5, fontWeight: '600', color: Colors.dangerInk, textAlign: 'center', paddingHorizontal: 10 },

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
