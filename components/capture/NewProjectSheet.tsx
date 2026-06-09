import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Btn } from '../ui/Btn';
import { Colors } from '../../constants/tokens';
import { useTheme } from '../../context/ThemeContext';
import { FOLDERS as DATA_FOLDERS } from '../../constants/data';
import type { Project } from '../../store/types';

const EMOJI_OPTIONS = [
  '📋','🛒','🎯','🏠','💼','📚','🌱','🎨',
  '🏋️','🎂','🧰','🏕️','✨','💡','🎵','⚽',
  '🌍','📦','🍕','🔧','🎓','❤️','🚀','🌟',
];

const COLOR_OPTIONS = [
  { label: 'Vert',    hex: '#1B9A5C' },
  { label: 'Tomate',  hex: '#E2674A' },
  { label: 'Bleu',    hex: '#4C8FD0' },
  { label: 'Rose',    hex: '#B0568B' },
  { label: 'Prune',   hex: '#7C6CD0' },
  { label: 'Ambre',   hex: '#E2A33C' },
  { label: 'Sauge',   hex: '#5C8A74' },
  { label: 'Encre',   hex: '#56554B' },
];

type Kind = 'list' | 'project';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (project: Omit<Project, 'id'>) => void;
}

export function NewProjectSheet({ open, onClose, onConfirm }: Props) {
  const colors = useTheme();
  const [kind, setKind]     = useState<Kind>('list');
  const [name, setName]     = useState('');
  const [emoji, setEmoji]   = useState('📋');
  const [color, setColor]   = useState(COLOR_OPTIONS[0].hex);
  const [folder, setFolder] = useState(DATA_FOLDERS[0].id);

  useEffect(() => {
    if (open) {
      setKind('list'); setName(''); setEmoji('📋');
      setColor(COLOR_OPTIONS[0].hex); setFolder(DATA_FOLDERS[0].id);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0;

  const handleCreate = () => {
    if (!canSubmit) return;
    onConfirm({
      name: name.trim(), emoji, color, kind, folder,
      shared: ['me'], favorite: false, sections: [],
    });
  };

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{kind === 'list' ? 'Nouvelle liste' : 'Nouveau projet'}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: Colors.ink2 }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 0 }} keyboardShouldPersistTaps="handled">

        {/* Kind toggle */}
        <View style={styles.kindRow}>
          {(['list', 'project'] as Kind[]).map(k => (
            <TouchableOpacity
              key={k}
              onPress={() => setKind(k)}
              activeOpacity={0.8}
              style={[
                styles.kindBtn,
                kind === k && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Text style={[styles.kindText, kind === k && { color: '#fff' }]}>
                {k === 'list' ? '☑ Liste' : '📌 Projet'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nom</Text>
          <View style={styles.nameRow}>
            <View style={[styles.emojiPreview, { backgroundColor: color + '20' }]}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={kind === 'list' ? 'Ex. Courses du week-end' : 'Ex. Rénovation cuisine'}
              placeholderTextColor={Colors.faint}
              style={styles.nameInput}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Emoji */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Icône</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map(e => (
              <TouchableOpacity
                key={e}
                onPress={() => setEmoji(e)}
                activeOpacity={0.7}
                style={[styles.emojiBtn, emoji === e && { backgroundColor: color + '28', borderColor: color }]}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Couleur</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map(c => (
              <TouchableOpacity
                key={c.hex}
                onPress={() => setColor(c.hex)}
                activeOpacity={0.8}
                style={[styles.colorDot, { backgroundColor: c.hex }, color === c.hex && styles.colorDotSelected]}
              />
            ))}
          </View>
        </View>

        {/* Folder */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Dossier</Text>
          <View style={styles.folderRow}>
            {DATA_FOLDERS.map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFolder(f.id)}
                activeOpacity={0.8}
                style={[
                  styles.folderChip,
                  folder === f.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Text style={{ fontSize: 15 }}>{f.emoji}</Text>
                <Text style={[styles.folderText, folder === f.id && { color: '#fff' }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Btn
          kind="primary"
          size="lg"
          onPress={handleCreate}
          disabled={!canSubmit}
          style={{ marginTop: 8, marginBottom: 4 }}
        >
          Créer {kind === 'list' ? 'la liste' : 'le projet'}
        </Btn>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:   { fontSize: 19, fontWeight: '800', color: Colors.ink },
  closeBtn:{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },

  kindRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  kindBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  kindText:{ fontSize: 15, fontWeight: '700', color: Colors.ink2 },

  fieldGroup: { marginBottom: 18 },
  label:      { fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },

  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.lineStrong, paddingHorizontal: 14, paddingVertical: 10 },
  emojiPreview:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameInput:   { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.ink },

  emojiGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.surface },

  colorRow:       { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot:       { width: 34, height: 34, borderRadius: 99 },
  colorDotSelected:{ borderWidth: 3, borderColor: Colors.ink, transform: [{ scale: 1.15 }] },

  folderRow:  { flexDirection: 'row', gap: 10 },
  folderChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.lineStrong, backgroundColor: Colors.surface },
  folderText: { fontSize: 13.5, fontWeight: '700', color: Colors.ink2 },
});
