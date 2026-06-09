import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { FOLDERS, TAGS, MEMBERS } from '../constants/data';
import { Colors, Radius, Space, FontFamily } from '../constants/tokens';
import { diffDays, todayD } from '../lib/dates';
import { Progress } from '../components/ui/Progress';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { TaskListRow } from '../components/tasks/TaskListRow';
import { TaskDetailSheet } from '../components/tasks/TaskDetailSheet';
import { NewProjectSheet } from '../components/capture/NewProjectSheet';
import { Toast } from '../components/ui/Toast';
import type { Task } from '../store/types';

function greetWord() {
  const h = new Date().getHours();
  return h < 12 ? 'Bonjour' : h < 18 ? 'Bel après-midi' : 'Bonsoir';
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, toggleDone } = useTaskStore();
  const { projects, addProject } = useProjectStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const today = todayD();
  const live = tasks.filter(t => !t.archived);
  const totalDone = live.filter(t => t.done).length;
  const totalAll = live.length;
  const overdue = live.filter(t => !t.done && t.due && diffDays(today, t.due) < 0).length;
  const todayN = live.filter(t => !t.done && t.due && diffDays(today, t.due) === 0).length;
  const favTasks = live.filter(t => t.favorite && !t.done);
  const pct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <View style={[styles.screen, { backgroundColor: Colors.appBg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ gap: 4 }}>
            <Text style={styles.eyebrow}>{greetWord()}</Text>
            <Text style={styles.title}>Accueil</Text>
          </View>
          <View style={styles.headerRight}>
            <Avatar m={MEMBERS.me} size={38} />
          </View>
        </View>

        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: Colors.accent }]}>
          <View style={styles.summaryTop}>
            <View style={{ gap: 6 }}>
              <Text style={styles.summaryLabel}>Avancement global</Text>
              <Text style={styles.summaryCount}>
                {totalDone}<Text style={styles.summaryTotal}> / {totalAll}</Text>
              </Text>
              <Text style={styles.summarySub}>{projects.length} projets · {live.filter(t => !t.done).length} en cours</Text>
            </View>
            <View style={styles.ringWrap}>
              <Text style={styles.ringPct}>{pct}%</Text>
              <View style={[styles.ringTrack, { borderColor: 'rgba(255,255,255,0.25)' }]} />
              <View style={[styles.ringFill, { width: `${pct}%` as unknown as number, backgroundColor: '#fff' }]} />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/agenda')}
            style={styles.summaryBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.summaryBtnText}>
              {overdue > 0 ? `⚠ ${overdue} en retard` : `☀ ${todayN} pour aujourd'hui`}
            </Text>
            <Text style={styles.summaryBtnRight}>Voir l'agenda ›</Text>
          </TouchableOpacity>
        </View>

        {/* Favorites */}
        {favTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Favoris</Text>
            <View style={styles.card}>
              {favTasks.map((t, i) => (
                <TaskListRow
                  key={t.id}
                  task={t}
                  onToggle={toggleDone}
                  onOpen={setSelectedTask}
                  last={i === favTasks.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étiquettes</Text>
          <View style={styles.tagsRow}>
            {Object.values(TAGS).map(tag => {
              const count = live.filter(x => !x.done && x.tags.includes(tag.id)).length;
              return (
                <TouchableOpacity
                  key={tag.id}
                  onPress={() => router.push({ pathname: '/tasks', params: { tag: tag.id } })}
                  style={[styles.tagChip, { backgroundColor: hexToRgba(tag.color, 0.12) }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                  <Text style={[styles.tagLabel, { color: tag.color }]}>{tag.label}</Text>
                  <Text style={[styles.tagCount, { color: tag.color }]}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Folders + Projects */}
        {FOLDERS.map(folder => {
          const folderProjects = projects.filter(p => p.folder === folder.id);
          return (
            <View key={folder.id} style={styles.section}>
              <View style={styles.folderHeader}>
                <Text style={styles.folderEmoji}>{folder.emoji}</Text>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderCount}>{folderProjects.length}</Text>
              </View>
              <View style={{ gap: 10 }}>
                {folderProjects.map(project => {
                  const list = tasks.filter(t => t.project === project.id && !t.archived);
                  const doneCount = list.filter(t => t.done).length;
                  const overdueCount = list.filter(t => !t.done && t.due && diffDays(today, t.due) < 0).length;
                  const todayCount = list.filter(t => !t.done && t.due && diffDays(today, t.due) === 0).length;
                  return (
                    <TouchableOpacity
                      key={project.id}
                      onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })}
                      style={styles.projCard}
                      activeOpacity={0.85}
                    >
                      <View style={styles.projTop}>
                        <View style={styles.projEmoji}><Text style={{ fontSize: 22 }}>{project.emoji}</Text></View>
                        <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                          <View style={styles.projTitleRow}>
                            <Text style={styles.projName} numberOfLines={1}>{project.name}</Text>
                            {project.favorite && <Text style={{ fontSize: 12 }}>🔥</Text>}
                          </View>
                          <View style={styles.projMeta}>
                            <Text style={styles.projMetaText}>{list.length - doneCount} en cours</Text>
                            {overdueCount > 0 && <Text style={[styles.projMetaText, { color: Colors.danger }]}>· {overdueCount} en retard</Text>}
                            {overdueCount === 0 && todayCount > 0 && <Text style={[styles.projMetaText, { color: Colors.warnInk }]}>· {todayCount} aujourd'hui</Text>}
                          </View>
                        </View>
                        <AvatarStack ids={project.shared} members={MEMBERS} size={24} />
                      </View>
                      <View style={styles.projFooter}>
                        <View style={{ flex: 1 }}>
                          <Progress value={doneCount} total={list.length} color={project.color} height={7} />
                        </View>
                        <Text style={styles.projProgress}>{doneCount}/{list.length}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* New project button */}
        <View style={{ paddingHorizontal: Space.md, paddingBottom: 26, marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => setNewProjOpen(true)}
            style={styles.newProjBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.newProjText}>+ Nouveau projet ou liste</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TaskDetailSheet task={selectedTask} onClose={() => setSelectedTask(null)} />

      <NewProjectSheet
        open={newProjOpen}
        onClose={() => setNewProjOpen(false)}
        onConfirm={(partial) => {
          addProject(partial);
          setNewProjOpen(false);
          setToast(`${partial.emoji} ${partial.name} créé${partial.kind === 'project' ? '' : 'e'}`);
        }}
      />
      <Toast message={toast} onHide={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 22, paddingBottom: 4 },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  eyebrow:     { fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  title:       { fontSize: 32, fontFamily: FontFamily.heading, color: Colors.ink, letterSpacing: -0.5 },

  summaryCard:  { marginHorizontal: Space.md, marginTop: 14, borderRadius: Radius.lg, padding: 18 },
  summaryTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  summaryCount: { fontSize: 30, fontWeight: '800', color: '#fff' },
  summaryTotal: { fontSize: 22, opacity: 0.6 },
  summarySub:   { fontSize: 13, color: 'rgba(255,255,255,0.82)' },
  ringWrap:     { width: 74, height: 74, alignItems: 'center', justifyContent: 'center' },
  ringPct:      { fontSize: 17, fontWeight: '700', color: '#fff', position: 'absolute', zIndex: 1 },
  ringTrack:    { position: 'absolute', width: 74, height: 74, borderRadius: 37, borderWidth: 5 },
  ringFill:     { position: 'absolute', left: 0, height: 5, top: 34.5, borderRadius: 99, opacity: 0.9 },
  summaryBtn:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, padding: 14 },
  summaryBtnText:  { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  summaryBtnRight: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  section:      { paddingHorizontal: Space.md, marginTop: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  card:         { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line, overflow: 'hidden' },

  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99 },
  tagDot:   { width: 7, height: 7, borderRadius: 99 },
  tagLabel: { fontSize: 13.5, fontWeight: '700' },
  tagCount: { fontSize: 13, fontWeight: '600', opacity: 0.7 },

  folderHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  folderEmoji:  { fontSize: 15 },
  folderName:   { fontSize: 14.5, fontWeight: '700', color: Colors.ink },
  folderCount:  { fontSize: 12, color: Colors.faint, fontWeight: '600' },

  projCard:     { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 15, borderWidth: 1, borderColor: Colors.line, gap: 12 },
  projTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  projEmoji:    { width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  projTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  projName:     { fontSize: 16, fontWeight: '700', color: Colors.ink, flex: 1 },
  projMeta:     { flexDirection: 'row', gap: 4 },
  projMetaText: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  projFooter:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  projProgress: { fontSize: 12.5, fontWeight: '700', color: Colors.ink2 },

  newProjBtn:  { height: 52, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.lineStrong, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  newProjText: { fontSize: 15, fontWeight: '600', color: Colors.ink2 },
});
