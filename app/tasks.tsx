import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '../store/taskStore';
import { PROJECTS, TAGS, MEMBERS, PRIORITIES } from '../constants/data';
import { Colors, Radius, Space, FontFamily } from '../constants/tokens';
import { filterTasks, sortTasks } from '../lib/sort';
import { TaskListRow } from '../components/tasks/TaskListRow';
import { TaskCard } from '../components/tasks/TaskCard';
import { Sheet } from '../components/ui/Sheet';
import { Btn } from '../components/ui/Btn';
import { TaskDetailSheet } from '../components/tasks/TaskDetailSheet';
import type { Task, FilterState, SortKey, StatusFilter } from '../store/types';

const STATUS_CHIPS: { id: StatusFilter; label: string }[] = [
  { id: 'active',   label: 'À faire' },
  { id: 'today',    label: "Aujourd'hui" },
  { id: 'overdue',  label: 'En retard' },
  { id: 'done',     label: 'Terminées' },
  { id: 'archived', label: 'Archives' },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'smart',    label: 'Importance (auto)' },
  { id: 'due',      label: 'Échéance' },
  { id: 'priority', label: 'Priorité' },
  { id: 'created',  label: 'Date de création' },
  { id: 'alpha',    label: 'Alphabétique' },
];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tag?: string; project?: string }>();
  const { tasks, toggleDone } = useTaskStore();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'active',
    tag: params.tag ?? undefined,
    project: params.project ?? undefined,
  });
  const [sort, setSort] = useState<SortKey>('smart');
  const [view, setView] = useState<'list' | 'card'>('list');
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filtered = useMemo(() => sortTasks(filterTasks(tasks, query, filters), sort), [tasks, query, filters, sort]);
  const activeFilterCount = (filters.project ? 1 : 0) + (filters.tag ? 1 : 0) + (filters.priorityMin ? 1 : 0) + (filters.assignee ? 1 : 0) + (filters.favorite ? 1 : 0);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.appBg }]}>
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: Space.md, paddingBottom: 4 }}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={{ gap: 4 }}>
            <Text style={styles.eyebrow}>{tasks.filter(t => !t.done && !t.archived).length} en cours</Text>
            <Text style={styles.title}>Tâches</Text>
          </View>
          <View style={styles.viewToggle}>
            {(['list', 'card'] as const).map(v => (
              <TouchableOpacity
                key={v}
                onPress={() => setView(v)}
                style={[styles.viewBtn, v === view && styles.viewBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16 }}>{v === 'list' ? '☰' : '⊞'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <Text style={{ fontSize: 16, color: Colors.faint }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une tâche, un tag…"
            placeholderTextColor={Colors.faint}
            style={styles.searchInput}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Text style={{ fontSize: 16, color: Colors.faint }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
          {STATUS_CHIPS.map(c => {
            const on = filters.status === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setFilters(f => ({ ...f, status: c.id }))}
                style={[styles.statusChip, on && styles.statusChipOn]}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusChipText, on && styles.statusChipTextOn]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort & filter bar */}
        <View style={styles.barRow}>
          <TouchableOpacity onPress={() => setSheet('sort')} style={styles.barBtn} activeOpacity={0.7}>
            <Text style={styles.barBtnText}>↕ {SORTS.find(s => s.id === sort)?.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSheet('filter')}
            style={[styles.barBtn, activeFilterCount > 0 && styles.barBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.barBtnText, activeFilterCount > 0 && styles.barBtnTextActive]}>
              ⚙ Filtres{activeFilterCount ? ` · ${activeFilterCount}` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Task list */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune tâche ne correspond.</Text>
        </View>
      ) : view === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          contentContainerStyle={{ paddingHorizontal: Space.md, paddingBottom: 120 }}
          ListHeaderComponent={<View style={{ height: 8 }} />}
          renderItem={({ item, index }) => (
            <View style={[
              index === 0 && styles.listFirst,
              index === filtered.length - 1 && styles.listLast,
              styles.listWrap,
            ]}>
              <TaskListRow
                task={item}
                onToggle={toggleDone}
                onOpen={setSelectedTask}
                last={index === filtered.length - 1}
              />
            </View>
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: Space.md, paddingBottom: 120, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          ListHeaderComponent={<View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <TaskCard task={item} onToggle={toggleDone} onOpen={setSelectedTask} />
            </View>
          )}
        />
      )}

      {/* Filter sheet */}
      <Sheet open={sheet === 'filter'} onClose={() => setSheet(null)}>
        <FilterSheetContent filters={filters} setFilters={setFilters} onClose={() => setSheet(null)} />
      </Sheet>

      {/* Sort sheet */}
      <Sheet open={sheet === 'sort'} onClose={() => setSheet(null)}>
        <Text style={styles.sheetTitle}>Trier par</Text>
        <View style={{ gap: 2 }}>
          {SORTS.map(s => (
            <TouchableOpacity
              key={s.id}
              onPress={() => { setSort(s.id); setSheet(null); }}
              style={styles.sortRow}
              activeOpacity={0.7}
            >
              <Text style={styles.sortLabel}>{s.label}</Text>
              {sort === s.id && <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Sheet>

      <TaskDetailSheet task={selectedTask} onClose={() => setSelectedTask(null)} />
    </View>
  );
}

function FilterSheetContent({ filters, setFilters, onClose }: { filters: FilterState; setFilters: React.Dispatch<React.SetStateAction<FilterState>>; onClose: () => void }) {
  const set = (patch: Partial<FilterState>) => setFilters(f => ({ ...f, ...patch }));

  const Chip = ({ on, color, label, onPress }: { on: boolean; color?: string; label: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.filterChip, on && { backgroundColor: color ?? Colors.ink, borderWidth: 0 }]}
    >
      <Text style={[styles.filterChipText, on && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.filterHeader}>
        <Text style={styles.sheetTitle}>Filtres</Text>
        <TouchableOpacity onPress={() => set({ project: undefined, tag: undefined, priorityMin: undefined, assignee: undefined, favorite: false })} activeOpacity={0.7}>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: Colors.accent }}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.filterSection}>Projet</Text>
      <View style={styles.filterRow}>
        {PROJECTS.map(p => <Chip key={p.id} on={filters.project === p.id} color={p.color} label={`${p.emoji} ${p.name}`} onPress={() => set({ project: filters.project === p.id ? undefined : p.id })} />)}
      </View>

      <Text style={styles.filterSection}>Étiquette</Text>
      <View style={styles.filterRow}>
        {Object.values(TAGS).map(t => <Chip key={t.id} on={filters.tag === t.id} color={t.color} label={t.label} onPress={() => set({ tag: filters.tag === t.id ? undefined : t.id })} />)}
      </View>

      <Text style={styles.filterSection}>Priorité minimum</Text>
      <View style={styles.filterRow}>
        {([5, 4, 3] as const).map(n => <Chip key={n} on={filters.priorityMin === n} color={PRIORITIES[n].color} label={`≥ ${PRIORITIES[n].label}`} onPress={() => set({ priorityMin: filters.priorityMin === n ? undefined : n })} />)}
      </View>

      <Text style={styles.filterSection}>Assigné à</Text>
      <View style={styles.filterRow}>
        {Object.values(MEMBERS).map(m => <Chip key={m.id} on={filters.assignee === m.id} color={m.color} label={m.name} onPress={() => set({ assignee: filters.assignee === m.id ? undefined : m.id })} />)}
        <Chip on={!!filters.favorite} color={Colors.amber} label="★ Favoris" onPress={() => set({ favorite: !filters.favorite })} />
      </View>

      <Btn kind="dark" size="lg" onPress={onClose} style={{ width: '100%', marginTop: 18 }}>Voir les résultats</Btn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow:  { fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  title:    { fontSize: 30, fontFamily: FontFamily.heading, color: Colors.ink, letterSpacing: -0.5 },

  viewToggle:  { flexDirection: 'row', backgroundColor: Colors.surface2, borderRadius: 11, padding: 3, gap: 3 },
  viewBtn:     { width: 38, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { backgroundColor: Colors.surface },

  search:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.lineStrong, borderRadius: 12, paddingHorizontal: 12, height: 44, marginTop: 12 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.ink },

  statusChip:       { height: 34, paddingHorizontal: 14, borderRadius: 99, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  statusChipOn:     { backgroundColor: Colors.ink, borderWidth: 0 },
  statusChipText:   { fontSize: 13.5, fontWeight: '600', color: Colors.ink2 },
  statusChipTextOn: { color: '#fff' },

  barRow:          { flexDirection: 'row', gap: 8, marginTop: 2, marginBottom: 4 },
  barBtn:          { height: 36, paddingHorizontal: 13, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  barBtnActive:    { backgroundColor: Colors.accentSoft, borderWidth: 0 },
  barBtnText:      { fontSize: 13.5, fontWeight: '600', color: Colors.ink2 },
  barBtnTextActive:{ color: Colors.accentInk },

  listWrap:  { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, overflow: 'hidden' },
  listFirst: { borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md },
  listLast:  { borderBottomLeftRadius: Radius.md, borderBottomRightRadius: Radius.md },

  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: { fontSize: 14, color: Colors.faint },

  sheetTitle:    { fontSize: 19, fontWeight: '800', color: Colors.ink, marginBottom: 12 },
  sortRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  sortLabel:     { fontSize: 15.5, fontWeight: '600', color: Colors.ink },

  filterHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  filterSection: { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  filterRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterChip:    { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.line },
  filterChipText:{ fontSize: 13.5, fontWeight: '600', color: Colors.ink2 },
});
