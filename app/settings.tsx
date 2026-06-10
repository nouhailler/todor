import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { Colors, Radius, Space, PALETTES, FontFamily } from '../constants/tokens';
import type { PaletteName } from '../constants/tokens';
import { exportJSON, exportCSV, exportPDF, parseImport } from '../lib/importExport';
import { useVisionProvider } from '../lib/vision';
import { fetchVisionModels, testOpenRouter, type VisionModel, type TestResult } from '../lib/openrouter';
import { MEMBERS } from '../constants/data';
import { AI_JSON_SAMPLE } from '../constants/data';
import { Avatar } from '../components/ui/Avatar';
import { Btn } from '../components/ui/Btn';
import { Sheet } from '../components/ui/Sheet';
import { Toast } from '../components/ui/Toast';

// ── Toggle switch ──────────────────────────────────────────────
function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      style={[styles.switch, { backgroundColor: on ? Colors.accent : Colors.lineStrong, justifyContent: on ? 'flex-end' : 'flex-start' }]}
    >
      <View style={styles.switchThumb} />
    </TouchableOpacity>
  );
}

// ── Setting row ────────────────────────────────────────────────
function SettingRow({ emoji, iconBg, title, sub, right, onPress, last }: {
  emoji?: string; iconBg?: string; title: string; sub?: string;
  right?: React.ReactNode; onPress?: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.settingRow, !last && styles.settingBorder]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {emoji && (
        <View style={[styles.settingIcon, { backgroundColor: iconBg ?? Colors.surface2 }]}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
      )}
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {right}
      {onPress && !right && <Text style={{ color: Colors.faint, fontSize: 16 }}>›</Text>}
    </TouchableOpacity>
  );
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ── Import sheet ───────────────────────────────────────────────
function ImportSheet({ open, onClose, onToast }: { open: boolean; onClose: () => void; onToast: (m: string) => void }) {
  const { bulkAdd } = useTaskStore();
  const [text, setText] = useState(AI_JSON_SAMPLE);
  const [result, setResult] = useState<{ ok: boolean; tasks?: any[]; error?: string } | null>(null);

  React.useEffect(() => {
    if (open) { setText(AI_JSON_SAMPLE); setResult(null); }
  }, [open]);

  const analyse = () => setResult(parseImport(text));
  const confirm = () => {
    if (!result?.tasks) return;
    bulkAdd(result.tasks);
    onClose();
    onToast(`${result.tasks.length} tâches importées`);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <Text style={styles.sheetTitle}>Import de tâches</Text>

      <View style={styles.importHint}>
        <Text style={{ fontSize: 15 }}>✨</Text>
        <Text style={styles.importHintText}>Demande à Claude un JSON de tâches, puis colle-le ici pour tout créer d'un coup.</Text>
      </View>

      <TextInput
        value={text}
        onChangeText={t => { setText(t); setResult(null); }}
        multiline
        spellCheck={false}
        style={styles.codeBox}
        placeholderTextColor={Colors.faint}
      />

      {result && !result.ok && (
        <View style={styles.errorBox}>
          <Text style={{ fontSize: 15 }}>⚠</Text>
          <Text style={styles.errorText}>{result.error}</Text>
        </View>
      )}

      {result?.ok && result.tasks && (
        <ScrollView style={{ maxHeight: 130 }}>
          <Text style={styles.previewEyebrow}>{result.tasks.length} tâches détectées</Text>
          {result.tasks.map((t, i) => (
            <View key={i} style={styles.previewRow}>
              <Text style={{ color: Colors.accent }}>✓</Text>
              <Text style={styles.previewText} numberOfLines={1}>{t.text}</Text>
              <Text style={styles.previewProject}>{t.projectName}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {result?.ok
        ? <Btn kind="primary" size="lg" onPress={confirm} style={{ marginTop: 14 }}>+ Créer {result.tasks!.length} tâches</Btn>
        : <Btn kind="dark" size="lg" onPress={analyse} style={{ marginTop: 14 }}>✨ Analyser le JSON</Btn>}
    </Sheet>
  );
}

// ── Sheet de config IA (OpenRouter) ────────────────────────────
function AISheet({ open, onClose, onToast }: { open: boolean; onClose: () => void; onToast: (m: string) => void }) {
  const { openRouterKey, openRouterModel, setOpenRouter } = useSettingsStore();
  const [key, setKey] = useState(openRouterKey);
  const [model, setModel] = useState(openRouterModel);
  const [models, setModels] = useState<VisionModel[] | null>(null);
  const [filter, setFilter] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);

  React.useEffect(() => {
    if (open) {
      setKey(openRouterKey); setModel(openRouterModel);
      setModels(null); setFilter(''); setTest(null);
    }
  }, [open]);

  const loadModels = async () => {
    setLoadingModels(true); setTest(null);
    try {
      setModels(await fetchVisionModels(key.trim()));
    } catch (e: any) {
      setTest({ ok: false, message: `Impossible de charger les modèles : ${e?.message ?? 'erreur'}` });
    } finally {
      setLoadingModels(false);
    }
  };

  const runTest = async () => {
    setTesting(true); setTest(null);
    setTest(await testOpenRouter(key.trim(), model.trim()));
    setTesting(false);
  };

  const save = () => {
    setOpenRouter(key.trim(), model.trim());
    onToast(key.trim() ? '📷 Scan photo via OpenRouter activé' : 'Clé OpenRouter retirée');
    onClose();
  };

  const filtered = models?.filter(m =>
    m.id.toLowerCase().includes(filter.toLowerCase()) || m.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Sheet open={open} onClose={onClose}>
      <Text style={styles.sheetTitle}>Scan photo — OpenRouter</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
        <View style={styles.importHint}>
          <Text style={{ fontSize: 15 }}>🔑</Text>
          <Text style={styles.importHintText}>
            Crée une clé sur openrouter.ai/keys, choisis un modèle vision, teste, puis enregistre.
            La clé reste sur cet appareil. Laisse vide pour désactiver.
          </Text>
        </View>

        <Text style={styles.fieldLabel}>Clé API</Text>
        <TextInput
          value={key}
          onChangeText={t => { setKey(t); setTest(null); }}
          placeholder="sk-or-…"
          placeholderTextColor={Colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={styles.fieldInput}
        />

        <Text style={styles.fieldLabel}>Modèle (vision)</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={model}
            onChangeText={t => { setModel(t); setTest(null); }}
            placeholder="ex. anthropic/claude-haiku-4.5"
            placeholderTextColor={Colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
          />
          <Btn kind="soft" size="sm" onPress={loadModels} disabled={!key.trim() || loadingModels}>
            {loadingModels ? '…' : 'Liste'}
          </Btn>
        </View>

        {filtered && (
          <View style={styles.modelListBox}>
            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder={`Filtrer ${models!.length} modèles vision…`}
              placeholderTextColor={Colors.faint}
              autoCapitalize="none"
              style={styles.modelFilter}
            />
            <ScrollView style={{ maxHeight: 170 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {filtered.slice(0, 60).map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { setModel(m.id); setTest(null); }}
                  style={styles.modelRow}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.modelId} numberOfLines={1}>{m.id}</Text>
                    <Text style={styles.modelName} numberOfLines={1}>{m.name}</Text>
                  </View>
                  {model === m.id && <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              ))}
              {filtered.length === 0 && <Text style={styles.modelEmpty}>Aucun modèle ne correspond.</Text>}
            </ScrollView>
          </View>
        )}

        {test && (
          <View style={[styles.errorBox, test.ok && { backgroundColor: Colors.accentSoft }]}>
            <Text style={{ fontSize: 15 }}>{test.ok ? '✅' : '⚠'}</Text>
            <Text style={[styles.errorText, test.ok && { color: Colors.accentInk }]}>{test.message}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Btn kind="dark" size="lg" onPress={runTest} disabled={testing || !key.trim() || !model.trim()}>
              {testing ? 'Test en cours…' : '🧪 Tester'}
            </Btn>
          </View>
          <View style={{ flex: 1 }}>
            <Btn kind="primary" size="lg" onPress={save}>
              Enregistrer
            </Btn>
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}

// ── Main screen ────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTaskStore();

  const { palette, setPalette, openRouterModel } = useSettingsStore();
  const visionProvider = useVisionProvider();
  const [notif, setNotif] = useState({ push: true, email: true, overdue: true, digest: true, multiple: true });
  const [autoSync, setAutoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const visionSub =
    visionProvider === 'openrouter' ? `OpenRouter · ${openRouterModel}`
    : visionProvider === 'anthropic' ? 'API Claude (clé .env)'
    : 'Non configuré — mode démo';

  const toggleNotif = (k: keyof typeof notif) => setNotif(n => ({ ...n, [k]: !n[k] }));

  const sync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setToast("Synchronisé · à l'instant"); }, 1400);
  };

  const handleExportJSON = () => {
    const json = exportJSON(tasks);
    Alert.alert('Export JSON', `${tasks.filter(t => !t.archived).length} tâches prêtes.\n\n${json.slice(0, 120)}…`);
    setToast('Export JSON prêt');
  };

  const handleExportCSV = () => {
    const csv = exportCSV(tasks);
    Alert.alert('Export CSV', csv.split('\n').slice(0, 4).join('\n') + '\n…');
    setToast('Export CSV prêt');
  };

  const handleExportPDF = async () => {
    try {
      await exportPDF(tasks);
    } catch {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Colors.appBg }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: Space.lg, paddingBottom: 6 }}>
          <Text style={styles.eyebrow}>Préférences</Text>
          <Text style={styles.title}>Réglages</Text>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <View style={styles.accountCard}>
            <Avatar m={MEMBERS.me} size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.accountName}>Toi</Text>
              <Text style={styles.accountSub}>toi@todor.app · Plan Famille</Text>
            </View>
            <TouchableOpacity style={styles.manageBtn} activeOpacity={0.7}>
              <Text style={styles.manageBtnText}>Gérer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Couleur d'accent */}
        <Section title="Apparence">
          {(Object.keys(PALETTES) as PaletteName[]).map((name, i, arr) => (
            <SettingRow
              key={name}
              title={name}
              sub="Couleur principale de l'interface"
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.paletteDot, { backgroundColor: PALETTES[name].accent }]} />
                  {palette === name && <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 16 }}>✓</Text>}
                </View>
              }
              onPress={() => setPalette(name)}
              last={i === arr.length - 1}
            />
          ))}
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow emoji="🔔" iconBg={Colors.accent} title="Notifications push" sub="Sur cet appareil" right={<Switch on={notif.push} onToggle={() => toggleNotif('push')} />} />
          <SettingRow emoji="📧" iconBg={Colors.sky} title="Notifications par e-mail" sub="toi@todor.app" right={<Switch on={notif.email} onToggle={() => toggleNotif('email')} />} />
          <SettingRow emoji="🔔" iconBg={Colors.accent} title="Rappels multiples" sub="Plusieurs alertes avant l'échéance" right={<Switch on={notif.multiple} onToggle={() => toggleNotif('multiple')} />} />
          <SettingRow emoji="⚠" iconBg={Colors.danger} title="Alertes de retard" sub="Prévenir dès qu'une tâche est en retard" right={<Switch on={notif.overdue} onToggle={() => toggleNotif('overdue')} />} />
          <SettingRow emoji="☀" iconBg={Colors.warn} title="Résumé quotidien" sub="Chaque matin à 8:00" right={<Switch on={notif.digest} onToggle={() => toggleNotif('digest')} />} last />
        </Section>

        {/* Sync */}
        <Section title="Synchronisation">
          <SettingRow emoji="🔄" iconBg={Colors.plum} title="Synchronisation auto" sub={autoSync ? 'Temps réel entre les membres' : 'Mode manuel'} right={<Switch on={autoSync} onToggle={() => setAutoSync(v => !v)} />} />
          <SettingRow
            emoji="🔄"
            iconBg={Colors.accent}
            title={syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
            sub="Dernière synchro · il y a 5 min"
            onPress={syncing ? undefined : sync}
            right={syncing ? <View style={styles.spinner} /> : undefined}
            last
          />
        </Section>

        {/* Assistant IA */}
        <Section title="Assistant IA">
          <SettingRow
            emoji="📷"
            iconBg={Colors.berry}
            title="Scan photo (vision)"
            sub={visionSub}
            onPress={() => setAiOpen(true)}
            last
          />
        </Section>

        {/* Import / Export */}
        <Section title="Import & export">
          <SettingRow emoji="✨" iconBg={Colors.accent} title="Importer des tâches" sub="Coller du JSON (généré par Claude)" onPress={() => setImportOpen(true)} />
          <SettingRow emoji="📤" iconBg={Colors.sky} title="Exporter en JSON" sub="Toutes les tâches actives" onPress={handleExportJSON} />
          <SettingRow emoji="📊" iconBg={Colors.berry} title="Exporter en CSV" sub="Pour Excel / Sheets" onPress={handleExportCSV} />
          <SettingRow emoji="📄" iconBg={Colors.danger} title="Exporter en PDF" sub="Fichier partageable" onPress={handleExportPDF} />
          <SettingRow emoji="📦" iconBg={Colors.ink} title="Archivées" sub={`${tasks.filter(t => t.archived).length} tâches archivées`} last />
        </Section>

        <Text style={styles.footer}>todor · v1.0 — fait avec 🌱</Text>
      </ScrollView>

      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} onToast={setToast} />
      <AISheet open={aiOpen} onClose={() => setAiOpen(false)} onToast={setToast} />
      <Toast message={toast} onHide={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  eyebrow:  { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  title:    { fontSize: 30, fontFamily: FontFamily.heading, color: Colors.ink, marginTop: 4 },

  section:     { paddingHorizontal: Space.md, marginTop: 18 },
  sectionTitle:{ fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line, overflow: 'hidden' },

  accountCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountName: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  accountSub:  { fontSize: 12.5, color: Colors.muted },
  manageBtn:   { borderRadius: 10, borderWidth: 1, borderColor: Colors.lineStrong, paddingHorizontal: 13, paddingVertical: 7 },
  manageBtnText: { fontSize: 13.5, fontWeight: '600', color: Colors.ink },

  settingRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: Colors.line },
  settingIcon:   { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingContent:{ flex: 1, gap: 2 },
  settingTitle:  { fontSize: 15, fontWeight: '600', color: Colors.ink },
  settingSub:    { fontSize: 12.5, color: Colors.muted },

  switch:      { width: 48, height: 29, borderRadius: 99, padding: 3, flexDirection: 'row', flexShrink: 0 },
  switchThumb: { width: 23, height: 23, borderRadius: 99, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },

  paletteDot: { width: 20, height: 20, borderRadius: 99 },

  spinner: { width: 18, height: 18, borderRadius: 99, borderWidth: 2, borderColor: Colors.lineStrong, borderTopColor: Colors.accent },

  sheetTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink, marginBottom: 12 },
  importHint:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.accentSoft, borderRadius: 12, padding: 12, marginBottom: 12 },
  importHintText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.accentInk },
  codeBox:        { borderWidth: 1, borderColor: Colors.lineStrong, borderRadius: 12, padding: 12, height: 180, fontFamily: 'monospace', fontSize: 12.5, lineHeight: 19, backgroundColor: Colors.surface2, color: Colors.ink, textAlignVertical: 'top' },
  errorBox:   { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.dangerSoft, borderRadius: 12, padding: 12, marginTop: 10 },
  errorText:  { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.dangerInk },
  previewEyebrow: { fontSize: 10, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  previewRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  previewText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  previewProject: { fontSize: 11.5, color: Colors.muted },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7, marginTop: 4 },
  fieldInput: { borderWidth: 1, borderColor: Colors.lineStrong, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14.5, color: Colors.ink, backgroundColor: Colors.surface, marginBottom: 14 },

  modelListBox: { borderWidth: 1, borderColor: Colors.line, borderRadius: 12, marginTop: 10, backgroundColor: Colors.surface2, overflow: 'hidden' },
  modelFilter:  { paddingHorizontal: 12, paddingVertical: 9, fontSize: 13.5, color: Colors.ink, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.surface },
  modelRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.line },
  modelId:      { fontSize: 13, fontWeight: '700', color: Colors.ink },
  modelName:    { fontSize: 11.5, color: Colors.muted },
  modelEmpty:   { fontSize: 13, color: Colors.muted, textAlign: 'center', paddingVertical: 14 },

  footer: { textAlign: 'center', fontSize: 12, color: Colors.faint, paddingVertical: 24 },
});
