import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '../store/taskStore';
import { Colors, Radius, Space } from '../constants/tokens';
import { todayD, diffDays, monthGrid, MONTHS, DOW_HEAD, fmtDate } from '../lib/dates';
import { DueBadge } from '../components/ui/DueBadge';
import { dueStatus } from '../lib/dates';
import { TaskDetailSheet } from '../components/tasks/TaskDetailSheet';
import type { Task } from '../store/types';

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTaskStore();
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const today = todayD();

  const [curMonth, setCurMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const grid = monthGrid(curMonth.y, curMonth.m);
  const shift = (n: number) => setCurMonth(c => { const d = new Date(c.y, c.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const withDue = tasks.filter(t => t.due && !t.archived);
  const overdue = withDue.filter(t => !t.done && diffDays(today, t.due!) < 0);
  const upcoming = withDue.filter(t => !t.done && diffDays(today, t.due!) >= 0).sort((a, b) => +a.due! - +b.due!);

  const tasksOnDay = (d: Date) => withDue.filter(t => diffDays(d, t.due!) === 0);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.appBg }]}>
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: Space.md, paddingBottom: 4 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Agenda</Text>
          <View style={styles.viewToggle}>
            {(['list', 'calendar'] as const).map(v => (
              <TouchableOpacity key={v} onPress={() => setView(v)} style={[styles.viewBtn, v === view && styles.viewBtnActive]} activeOpacity={0.7}>
                <Text style={{ fontSize: 15 }}>{v === 'list' ? '☰' : '📅'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {view === 'calendar' && (
          <View style={{ paddingHorizontal: Space.md }}>
            {/* Month nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => shift(-1)} style={styles.navBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 18, color: Colors.ink2 }}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS[curMonth.m]} {curMonth.y}</Text>
              <TouchableOpacity onPress={() => shift(1)} style={styles.navBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 18, color: Colors.ink2 }}>›</Text>
              </TouchableOpacity>
            </View>
            {/* Day headers */}
            <View style={styles.dayHeaders}>
              {DOW_HEAD.map((d, i) => <Text key={i} style={styles.dayHeader}>{d}</Text>)}
            </View>
            {/* Grid */}
            {grid.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((d, di) => {
                  if (!d) return <View key={di} style={styles.dayCell} />;
                  const isToday = diffDays(today, d) === 0;
                  const dayTasks = tasksOnDay(d);
                  return (
                    <View key={di} style={styles.dayCell}>
                      <View style={[styles.dayNum, isToday && { backgroundColor: Colors.accent }]}>
                        <Text style={[styles.dayNumText, isToday && { color: '#fff', fontWeight: '700' }]}>{d.getDate()}</Text>
                      </View>
                      {dayTasks.length > 0 && <View style={[styles.dot, { backgroundColor: dayTasks[0].color }]} />}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <View style={[styles.section, { marginTop: view === 'calendar' ? 18 : 0 }]}>
            <Text style={[styles.sectionTitle, { color: Colors.danger }]}>⚠ En retard · {overdue.length}</Text>
            <View style={styles.taskList}>
              {overdue.map((t, i) => (
                <AgendaRow key={t.id} task={t} today={today} onOpen={setSelectedTask} last={i === overdue.length - 1} />
              ))}
            </View>
          </View>
        )}

        {/* Upcoming by date */}
        {upcoming.length === 0 && overdue.length === 0 && (
          <View style={styles.empty}><Text style={styles.emptyText}>Aucune tâche avec échéance.</Text></View>
        )}
        {groupByDate(upcoming, today).map(({ label, items }) => (
          <View key={label} style={styles.section}>
            <Text style={styles.sectionTitle}>{label}</Text>
            <View style={styles.taskList}>
              {items.map((t, i) => (
                <AgendaRow key={t.id} task={t} today={today} onOpen={setSelectedTask} last={i === items.length - 1} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <TaskDetailSheet task={selectedTask} onClose={() => setSelectedTask(null)} />
    </View>
  );
}

function AgendaRow({ task, today, onOpen, last }: { task: Task; today: Date; onOpen: (t: Task) => void; last: boolean }) {
  const status = dueStatus(task.due, task.done, today);
  return (
    <TouchableOpacity onPress={() => onOpen(task)} style={[styles.agendaRow, !last && styles.border]} activeOpacity={0.7}>
      <View style={[styles.colorBar, { backgroundColor: task.color }]} />
      <View style={styles.agendaContent}>
        <Text style={styles.agendaText} numberOfLines={1}>{task.text}</Text>
        <Text style={styles.agendaProject}>{task.emoji} {task.projectName}</Text>
      </View>
      <DueBadge status={status} time={task.time} size="sm" />
    </TouchableOpacity>
  );
}

function groupByDate(tasks: Task[], today: Date): { label: string; items: Task[] }[] {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const n = diffDays(today, t.due!);
    const label = n === 0 ? "Aujourd'hui" : n === 1 ? 'Demain' : fmtDate(t.due!);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(t);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

const styles = StyleSheet.create({
  screen:     { flex: 1 },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:      { fontSize: 30, fontWeight: '800', color: Colors.ink },
  viewToggle: { flexDirection: 'row', backgroundColor: Colors.surface2, borderRadius: 11, padding: 3, gap: 3 },
  viewBtn:    { width: 38, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { backgroundColor: Colors.surface },

  monthNav:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15.5, fontWeight: '700', color: Colors.ink },
  dayHeaders: { flexDirection: 'row' },
  dayHeader:  { flex: 1, textAlign: 'center', fontSize: 11.5, fontWeight: '700', color: Colors.faint, paddingVertical: 4 },
  weekRow:    { flexDirection: 'row' },
  dayCell:    { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayNum:     { width: 30, height: 30, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  dayNumText: { fontSize: 14, color: Colors.ink2 },
  dot:        { width: 5, height: 5, borderRadius: 99 },

  section:      { paddingHorizontal: Space.md, marginTop: 18 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  taskList:     { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line, overflow: 'hidden' },

  agendaRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, position: 'relative' },
  border:        { borderBottomWidth: 1, borderBottomColor: Colors.line },
  colorBar:      { width: 4, height: 36, borderRadius: 99, flexShrink: 0 },
  agendaContent: { flex: 1, gap: 3 },
  agendaText:    { fontSize: 15, fontWeight: '500', color: Colors.ink },
  agendaProject: { fontSize: 12, color: Colors.muted, fontWeight: '600' },

  empty:     { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.faint },
});
