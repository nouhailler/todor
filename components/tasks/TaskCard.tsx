import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/tokens';
import { DueBadge } from '../ui/DueBadge';
import { PriorityBar } from '../ui/PriorityBar';
import { Avatar } from '../ui/Avatar';
import { TagChips } from '../ui/TagChips';
import { dueStatus, todayD } from '../../lib/dates';
import { MEMBERS } from '../../constants/data';
import type { Task } from '../../store/types';

interface Props { task: Task; onToggle: (id: string) => void; onOpen: (task: Task) => void }

export function TaskCard({ task, onToggle, onOpen }: Props) {
  const today = todayD();
  const status = (task.due || task.done) ? dueStatus(task.due, task.done, today) : null;

  return (
    <TouchableOpacity onPress={() => onOpen(task)} activeOpacity={0.8} style={styles.card}>
      <PriorityBar priority={task.priority} />

      <View style={styles.topRow}>
        <View style={styles.projectBadge}>
          <View style={[styles.dot, { backgroundColor: task.color }]} />
          <Text style={styles.projectName} numberOfLines={1}>{task.projectName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onToggle(task.id)}
          activeOpacity={0.7}
          style={[styles.checkbox, task.done && { backgroundColor: Colors.accent, borderWidth: 0 }]}
        >
          {task.done && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, task.done && styles.titleDone]} numberOfLines={2}>
        {task.text}
      </Text>

      <TagChips tagIds={task.tags} />

      <View style={styles.footer}>
        {status
          ? <DueBadge status={status} time={task.time} size="sm" />
          : <Text style={styles.noDate}>Sans date</Text>}
        <View style={styles.footerRight}>
          {task.assignee && MEMBERS[task.assignee] && (
            <Avatar m={MEMBERS[task.assignee]} size={20} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:         { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line, padding: 13, paddingLeft: 15, gap: 10, overflow: 'hidden', position: 'relative' },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  projectBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
  dot:          { width: 7, height: 7, borderRadius: 99, flexShrink: 0 },
  projectName:  { fontSize: 11.5, color: Colors.muted, fontWeight: '700', flex: 1 },
  checkbox:     { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: Colors.lineStrong, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkmark:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  title:        { fontSize: 15, fontWeight: '600', color: Colors.ink, lineHeight: 21 },
  titleDone:    { color: Colors.faint, textDecorationLine: 'line-through' },
  footer:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 },
  noDate:       { fontSize: 11.5, color: Colors.faint },
  footerRight:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
});
