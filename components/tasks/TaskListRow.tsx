import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/tokens';
import { DueBadge } from '../ui/DueBadge';
import { PriorityBar } from '../ui/PriorityBar';
import { Avatar } from '../ui/Avatar';
import { dueStatus, todayD } from '../../lib/dates';
import { MEMBERS, PRIORITIES } from '../../constants/data';
import type { Task } from '../../store/types';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onOpen: (task: Task) => void;
  showProject?: boolean;
  last?: boolean;
}

export function TaskListRow({ task, onToggle, onOpen, showProject = true, last }: Props) {
  const today = todayD();
  const status = (task.due || task.done) ? dueStatus(task.due, task.done, today) : null;
  const priorityColor = PRIORITIES[task.priority]?.color;

  return (
    <View style={[styles.row, !last && styles.border]}>
      <PriorityBar priority={task.priority} />
      <TouchableOpacity
        onPress={() => onToggle(task.id)}
        activeOpacity={0.7}
        style={[styles.checkbox, task.done && { backgroundColor: Colors.accent, borderWidth: 0 }]}
      >
        {task.done && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onOpen(task)} style={styles.content} activeOpacity={0.7}>
        <View style={styles.titleRow}>
          {task.priority >= 4 && <Text style={[styles.flag, { color: priorityColor }]}>⚑ </Text>}
          <Text
            style={[styles.title, task.done && styles.titleDone]}
            numberOfLines={1}
          >
            {task.text}
          </Text>
          {task.favorite && <Text style={styles.flame}> 🔥</Text>}
        </View>
        <View style={styles.metaRow}>
          {showProject && (
            <View style={styles.projectBadge}>
              <View style={[styles.dot, { backgroundColor: task.color }]} />
              <Text style={styles.projectName}>{task.projectName}</Text>
            </View>
          )}
          {task.recur && (
            <Text style={styles.metaText}>↻ {task.recur.label}</Text>
          )}
          {task.comments && task.comments.length > 0 && (
            <Text style={styles.metaText}>💬 {task.comments.length}</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.right}>
        {status && <DueBadge status={status} time={task.time} size="sm" />}
        {task.assignee && MEMBERS[task.assignee] && (
          <View style={{ marginTop: 4 }}>
            <Avatar m={MEMBERS[task.assignee]} size={20} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, position: 'relative', gap: 12 },
  border:      { borderBottomWidth: 1, borderBottomColor: Colors.line },
  checkbox:    { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: Colors.lineStrong, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  checkmark:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  content:     { flex: 1, gap: 4, minWidth: 0 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  title:       { fontSize: 15, fontWeight: '500', color: Colors.ink, flex: 1 },
  titleDone:   { color: Colors.faint, textDecorationLine: 'line-through' },
  flag:        { fontSize: 12, fontWeight: '700', flexShrink: 0 },
  flame:       { fontSize: 11, flexShrink: 0 },
  metaRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  projectBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:         { width: 7, height: 7, borderRadius: 99 },
  projectName: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  metaText:    { fontSize: 11.5, color: Colors.faint, fontWeight: '600' },
  right:       { alignItems: 'flex-end', flexShrink: 0, gap: 4 },
});
