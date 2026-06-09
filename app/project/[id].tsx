import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTaskStore } from '../../store/taskStore';
import { PROJECTS, MEMBERS } from '../../constants/data';
import { Colors, Radius, Space, FontFamily } from '../../constants/tokens';
import { sortTasks } from '../../lib/sort';
import { todayD } from '../../lib/dates';
import { Progress } from '../../components/ui/Progress';
import { AvatarStack } from '../../components/ui/Avatar';
import { TaskListRow } from '../../components/tasks/TaskListRow';
import { TaskDetailSheet } from '../../components/tasks/TaskDetailSheet';
import { VoiceSheet, type ParsedItem } from '../../components/capture/VoiceSheet';
import { PhotoSheet, type PhotoItem } from '../../components/capture/PhotoSheet';
import { Toast } from '../../components/ui/Toast';
import type { Task } from '../../store/types';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, toggleDone, addTask } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [text, setText] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [activeCapture, setActiveCapture] = useState<'voice' | 'photo' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const project = PROJECTS.find(p => p.id === id);
  if (!project) return null;

  const today = todayD();
  const all    = tasks.filter(t => t.project === id && !t.archived);
  const active = all.filter(t => !t.done);
  const done   = all.filter(t => t.done);
  const prog   = { done: done.length, total: all.length };

  // group by section
  let groups: { title: string | null; items: Task[] }[];
  if (project.sections.length) {
    groups = project.sections.map(s => ({ title: s, items: active.filter(t => t.section === s) }));
    const others = active.filter(t => !t.section || !project.sections.includes(t.section));
    if (others.length) groups.unshift({ title: 'À trier', items: others });
    groups = groups.filter(g => g.items.length);
  } else {
    groups = [{ title: null, items: sortTasks(active, 'smart') }];
  }

  const submit = () => {
    if (!text.trim()) return;
    addTask({ text: text.trim(), project: id });
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.appBg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 18, color: Colors.ink }}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{project.name}</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.projInfo}>
          <View style={styles.emojiBox}><Text style={{ fontSize: 23 }}>{project.emoji}</Text></View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.projName}>{project.name}</Text>
            <View style={styles.projMembers}>
              <AvatarStack ids={project.shared} members={MEMBERS} size={20} />
              <Text style={styles.projMembersText}>· {project.shared.length} membre{project.shared.length > 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingBottom: 12 }}>
          <Progress value={prog.done} total={prog.total} showLabel />
        </View>
      </View>

      {/* Tasks */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Space.md, paddingBottom: 20 }}>
        {groups.map((group, gi) => (
          <View key={gi} style={{ marginTop: 14 }}>
            {group.title && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{group.title}</Text>
                <Text style={styles.sectionCount}>{group.items.length}</Text>
              </View>
            )}
            <View style={styles.taskList}>
              {group.items.map((t, i) => (
                <TaskListRow key={t.id} task={t} onToggle={toggleDone} onOpen={setSelectedTask} showProject={false} last={i === group.items.length - 1} />
              ))}
            </View>
          </View>
        ))}

        {active.length === 0 && (
          <Text style={styles.empty}>Tout est fait ici 🎉</Text>
        )}

        {done.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <TouchableOpacity onPress={() => setShowDone(v => !v)} style={styles.doneToggle} activeOpacity={0.7}>
              <Text style={{ fontSize: 14 }}>{showDone ? '▼' : '›'}</Text>
              <Text style={styles.doneLabel}>{done.length} TERMINÉE{done.length > 1 ? 'S' : ''}</Text>
            </TouchableOpacity>
            {showDone && (
              <View style={styles.taskList}>
                {done.map((t, i) => (
                  <TaskListRow key={t.id} task={t} onToggle={toggleDone} onOpen={setSelectedTask} showProject={false} last={i === done.length - 1} />
                ))}
              </View>
            )}
          </View>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>

      {/* Composer */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.composerInput}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            returnKeyType="done"
            placeholder={project.kind === 'list' ? 'Ajouter un article…' : 'Ajouter une tâche…'}
            placeholderTextColor={Colors.faint}
            style={styles.composerText}
          />
          {text.trim() ? (
            <TouchableOpacity onPress={submit} style={[styles.composerBtn, { backgroundColor: Colors.accent }]} activeOpacity={0.8}>
              <Text style={{ fontSize: 18, color: '#fff' }}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity onPress={() => setActiveCapture('voice')} style={[styles.composerBtn, { backgroundColor: Colors.surface2 }]} activeOpacity={0.8}>
                <Text style={{ fontSize: 18 }}>🎙</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveCapture('photo')} style={[styles.composerBtn, { backgroundColor: Colors.surface2 }]} activeOpacity={0.8}>
                <Text style={{ fontSize: 18 }}>📷</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <TaskDetailSheet task={selectedTask} onClose={() => setSelectedTask(null)} />

      <VoiceSheet
        open={activeCapture === 'voice'}
        onClose={() => setActiveCapture(null)}
        onConfirm={(items: ParsedItem[]) => {
          items.forEach(item => addTask({ text: item.text, project: id, section: item.cat }));
          setActiveCapture(null);
          setToast(`${items.length} article${items.length > 1 ? 's' : ''} ajouté${items.length > 1 ? 's' : ''}`);
        }}
      />

      <PhotoSheet
        open={activeCapture === 'photo'}
        onClose={() => setActiveCapture(null)}
        onConfirm={(items: PhotoItem[]) => {
          items.forEach(item => addTask({ text: item.text, project: id }));
          setActiveCapture(null);
          setToast(`${items.length} article${items.length > 1 ? 's' : ''} ajouté${items.length > 1 ? 's' : ''}`);
        }}
      />

      <Toast message={toast} onHide={() => setToast(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:      { backgroundColor: Colors.appBg, paddingHorizontal: Space.md, borderBottomWidth: 1, borderBottomColor: Colors.line },
  headerNav:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  navTitle:    { fontSize: 16, fontWeight: '700', color: Colors.ink, flex: 1, textAlign: 'center' },
  projInfo:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12 },
  emojiBox:    { width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  projName:    { fontSize: 22, fontFamily: FontFamily.heading, color: Colors.ink },
  projMembers: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  projMembersText: { fontSize: 12.5, color: Colors.muted },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 8 },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCount:  { fontSize: 11.5, color: Colors.faint, fontWeight: '600' },
  taskList:      { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line, overflow: 'hidden' },

  empty:      { textAlign: 'center', color: Colors.faint, fontSize: 14, paddingVertical: 30 },
  doneToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingBottom: 8 },
  doneLabel:  { fontSize: 12.5, color: Colors.muted, fontWeight: '700' },

  composer:      { backgroundColor: Colors.appBg, borderTopWidth: 1, borderTopColor: Colors.line, padding: 14 },
  composerInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: Colors.lineStrong, gap: 8 },
  composerText:  { flex: 1, fontSize: 15.5, color: Colors.ink, minWidth: 0 },
  composerBtn:   { width: 40, height: 40, borderRadius: 99, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
