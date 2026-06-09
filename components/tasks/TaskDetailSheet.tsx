import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '../../store/taskStore';
import { PROJECTS, MEMBERS, TAGS, PRIORITIES } from '../../constants/data';
import { Colors, Radius, Space } from '../../constants/tokens';
import { dueStatus, fmtLong, fmtDayLabel, todayD, diffDays, startOfDay, addDays, monthGrid, MONTHS, DOW_HEAD } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import { TagChips } from '../ui/TagChips';
import { Btn } from '../ui/Btn';
import type { Task, Reminder, RecurRule } from '../../store/types';

function relTime(d: Date, today: Date): string {
  const n = diffDays(today, d);
  if (n === 0) return "aujourd'hui";
  if (n === -1) return 'hier';
  if (n < 0) return `il y a ${-n} j`;
  return fmtLong(d);
}

function reminderLabel(rm: Reminder): string {
  const u: Record<string, string> = { min: 'minute', hour: 'heure', day: 'jour' };
  if (rm.value === 0) return "À l'heure de l'échéance";
  return `${rm.value} ${u[rm.unit]}${rm.value > 1 ? 's' : ''} avant`;
}

interface Props { task: Task | null; onClose: () => void }

type PickerType = 'due' | 'start' | 'recur' | 'reminder' | 'tags' | 'project' | 'assignee' | 'priority' | null;

export function TaskDetailSheet({ task, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { update, toggleDone, toggleFav, archive, remove, addComment } = useTaskStore();
  const [picker, setPicker] = useState<PickerType>(null);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (task) { setText(task.text); setNotes(task.notes ?? ''); }
  }, [task?.id]);

  if (!task) return null;

  const today = todayD();
  const up = (patch: Partial<Task>, action?: string) => update(task.id, patch, action);
  const proj = PROJECTS.find(p => p.id === task.project);
  const status = dueStatus(task.due, task.done, today);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[styles.panel, { height: '94%' }]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.7}>
              <Text style={{ fontSize: 20, color: Colors.ink }}>⌄</Text>
            </TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity onPress={() => toggleFav(task.id)} style={styles.iconBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 18 }}>{task.favorite ? '🔥' : '🤍'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { archive(task.id, !task.archived); onClose(); }} style={styles.iconBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 16, color: Colors.ink2 }}>📦</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { remove(task.id); onClose(); }} style={[styles.iconBtn, { backgroundColor: Colors.dangerSoft }]} activeOpacity={0.7}>
                <Text style={{ fontSize: 16, color: Colors.danger }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Space.md, paddingBottom: insets.bottom + 28 }}>
            {/* Day counter */}
            <DayCounter due={task.due} done={task.done} time={task.time} />

            {/* Title */}
            <TextInput
              value={text}
              onChangeText={setText}
              onBlur={() => text.trim() && text !== task.text && up({ text: text.trim() }, 'a modifié le titre')}
              multiline
              style={[styles.taskTitle, task.done && { textDecorationLine: 'line-through', color: Colors.faint }]}
            />

            {/* Toggle done */}
            <TouchableOpacity
              onPress={() => toggleDone(task.id)}
              style={[styles.doneBtn, task.done && { backgroundColor: Colors.accentSoft }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.doneBtnText, task.done && { color: Colors.accentInk }]}>
                {task.done ? '↩ Réactiver la tâche' : '✓ Marquer comme terminée'}
              </Text>
            </TouchableOpacity>

            {/* Organisation */}
            <SectionTitle label="Organisation" />
            <DetailRow icon="📋" label="Projet / liste" value={proj ? `${proj.emoji} ${proj.name}` : '—'} onPress={() => setPicker('project')} />
            <DetailRow icon="⚑" label="Priorité" value={task.priority ? `${PRIORITIES[task.priority].label} · ${task.priority}/5` : 'Sans priorité'} onPress={() => setPicker('priority')} />
            <DetailRow icon="🏷" label="Étiquettes" value={task.tags.length ? undefined : 'Aucune'} onPress={() => setPicker('tags')}>
              {task.tags.length > 0 && <TagChips tagIds={task.tags} />}
            </DetailRow>
            <DetailRow icon="👤" label="Assigné à" value={task.assignee ? MEMBERS[task.assignee]?.name : 'Personne'} onPress={() => setPicker('assignee')}>
              {task.assignee && MEMBERS[task.assignee] && <Avatar m={MEMBERS[task.assignee]} size={26} />}
            </DetailRow>

            {/* Dates */}
            <SectionTitle label="Dates & échéances" />
            <DetailRow icon="📅" label="Échéance" value={task.due ? fmtLong(task.due) : 'Aucune'} sub={task.due && task.time ? `à ${task.time}` : undefined} onPress={() => setPicker('due')} />
            <DetailRow icon="🏁" label="Date de début" value={task.start ? fmtLong(task.start) : 'Aucune'} onPress={() => setPicker('start')} />
            <DetailRow icon="🔁" label="Récurrence" value={task.recur ? task.recur.label : 'Ne se répète pas'} onPress={() => setPicker('recur')} />
            <DetailRow icon="🕐" label="Date de création" value={fmtLong(task.created)} sub={relTime(task.created, today)} />

            {/* Reminders */}
            <SectionTitle label="Rappels" action={<TouchableOpacity onPress={() => setPicker('reminder')} activeOpacity={0.7}><Text style={styles.actionLink}>+ Ajouter</Text></TouchableOpacity>} />
            {(task.reminders ?? []).length > 0
              ? (task.reminders ?? []).map((rm, i) => (
                <View key={i} style={styles.reminderRow}>
                  <Text style={{ fontSize: 16 }}>🔔</Text>
                  <Text style={styles.reminderLabel}>{reminderLabel(rm)}</Text>
                  <View style={styles.reminderChannel}>
                    <Text style={styles.reminderChannelText}>{rm.channel === 'email' ? 'E-mail' : 'Push'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => up({ reminders: (task.reminders ?? []).filter((_, j) => j !== i) })} activeOpacity={0.7}>
                    <Text style={{ color: Colors.faint }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
              : <Text style={styles.emptyText}>Aucun rappel programmé.</Text>}

            {/* Notes */}
            <SectionTitle label="Notes" />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onBlur={() => notes !== (task.notes ?? '') && up({ notes })}
              multiline
              placeholder="Ajouter une note, un lien, un détail…"
              placeholderTextColor={Colors.faint}
              style={styles.notes}
            />

            {/* Comments */}
            <SectionTitle label="Commentaires" />
            <View style={{ gap: 10 }}>
              {(task.comments ?? []).map((c, i) => (
                <View key={i} style={styles.comment}>
                  <Avatar m={MEMBERS[c.by] ?? MEMBERS.me} size={30} />
                  <View style={styles.commentBubble}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentName}>{MEMBERS[c.by]?.name ?? 'Inconnu'}</Text>
                      <Text style={styles.commentTime}>{relTime(c.at, today)}</Text>
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.commentInput}>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  onSubmitEditing={() => { if (comment.trim()) { addComment(task.id, comment.trim()); setComment(''); } }}
                  placeholder="Écrire un commentaire…"
                  placeholderTextColor={Colors.faint}
                  style={styles.commentField}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={() => { if (comment.trim()) { addComment(task.id, comment.trim()); setComment(''); } }}
                  style={[styles.sendBtn, { backgroundColor: comment.trim() ? Colors.accent : Colors.surface2 }]}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: comment.trim() ? '#fff' : Colors.faint, fontSize: 16 }}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* History */}
            <SectionTitle label="Historique" />
            <View style={{ gap: 2, paddingLeft: 4 }}>
              {(task.history ?? []).slice().reverse().map((h, i) => (
                <View key={i} style={styles.historyRow}>
                  <View style={styles.historyDot} />
                  <Text style={styles.historyText}>
                    <Text style={styles.historyName}>{MEMBERS[h.by]?.name ?? 'todor'}</Text>
                    {' '}{h.action}
                  </Text>
                  <Text style={styles.historyTime}>{relTime(h.at, today)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Nested pickers */}
      {picker === 'due' && (
        <DatePickerSheet
          title="Échéance"
          date={task.due}
          time={task.time}
          withTime
          onClose={() => setPicker(null)}
          onSave={(d, t) => { up({ due: d, time: t }, "a modifié l'échéance"); setPicker(null); }}
          onClear={() => { up({ due: null, time: undefined }); setPicker(null); }}
        />
      )}
      {picker === 'start' && (
        <DatePickerSheet
          title="Date de début"
          date={task.start}
          onClose={() => setPicker(null)}
          onSave={(d) => { up({ start: d }, 'a défini une date de début'); setPicker(null); }}
          onClear={() => { up({ start: null }); setPicker(null); }}
        />
      )}
      {picker === 'recur' && (
        <RecurPickerSheet
          recur={task.recur}
          onClose={() => setPicker(null)}
          onSave={(rc) => { up({ recur: rc ?? undefined }, rc ? 'a défini une récurrence' : 'a retiré la récurrence'); setPicker(null); }}
        />
      )}
      {picker === 'tags' && (
        <TagPickerSheet
          selected={task.tags}
          onClose={() => setPicker(null)}
          onSave={(tags) => { up({ tags }); setPicker(null); }}
        />
      )}
      {picker === 'project' && (
        <ProjectPickerSheet
          value={task.project}
          onClose={() => setPicker(null)}
          onSave={(p) => { up({ project: p }, 'a déplacé la tâche'); setPicker(null); }}
        />
      )}
      {picker === 'assignee' && (
        <AssigneePickerSheet
          value={task.assignee}
          onClose={() => setPicker(null)}
          onSave={(a) => { up({ assignee: a ?? undefined }, a ? `a assigné à ${MEMBERS[a]?.name}` : "a retiré l'assignation"); setPicker(null); }}
        />
      )}
      {picker === 'priority' && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setPicker(null)}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.scrim} onPress={() => setPicker(null)} activeOpacity={1} />
            <View style={[styles.panel, { maxHeight: '50%' }]}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Priorité</Text>
              <View style={{ gap: 4 }}>
                {([0, 1, 2, 3, 4, 5] as const).map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => { up({ priority: n }, 'a changé la priorité'); setPicker(null); }}
                    style={[styles.priorityRow, task.priority === n && { backgroundColor: Colors.surface2 }]}
                    activeOpacity={0.7}
                  >
                    {n === 0
                      ? <Text style={[styles.priorityLabel, { color: Colors.faint }]}>Sans priorité</Text>
                      : <>
                          <View style={[styles.priorityDot, { backgroundColor: PRIORITIES[n].color }]} />
                          <Text style={[styles.priorityLabel, { color: PRIORITIES[n].color }]}>{PRIORITIES[n].label}</Text>
                          <Text style={styles.priorityShort}>{PRIORITIES[n].short}</Text>
                        </>
                    }
                    {task.priority === n && <Text style={{ color: Colors.accent, marginLeft: 'auto', fontWeight: '700' }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
      {picker === 'reminder' && (
        <ReminderSheet
          onClose={() => setPicker(null)}
          onSave={(rm) => { up({ reminders: [...(task.reminders ?? []), rm] }); setPicker(null); }}
        />
      )}
    </Modal>
  );
}

function SectionTitle({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{label.toUpperCase()}</Text>
      {action}
    </View>
  );
}

function DetailRow({ icon, label, value, sub, onPress, children }: {
  icon: string; label: string; value?: string; sub?: string; onPress?: () => void; children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.detailRow} activeOpacity={0.7}>
      <Text style={{ fontSize: 18, width: 22 }}>{icon}</Text>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        {value !== undefined && <Text style={[styles.detailValue, !value && { color: Colors.faint }]}>{value || '—'}</Text>}
        {children}
        {sub && <Text style={styles.detailSub}>{sub}</Text>}
      </View>
      {onPress && <Text style={{ color: Colors.faint }}>›</Text>}
    </TouchableOpacity>
  );
}

function DayCounter({ due, done, time }: { due?: Date | null; done: boolean; time?: string }) {
  const today = todayD();
  const s = dueStatus(due, done, today);
  const n = due ? diffDays(today, due) : null;

  let big: string, small: string;
  if (done)        { big = 'Fait';   small = 'Tâche terminée'; }
  else if (!n && n !== 0) { big = '—'; small = 'Aucune échéance'; }
  else if (n < 0)  { big = `+${-n}`; small = `jour${-n > 1 ? 's' : ''} de retard`; }
  else if (n === 0){ big = 'Auj.';   small = time ? `à ${time}` : "à faire aujourd'hui"; }
  else             { big = `J‑${n}`; small = `${n} jour${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''}`; }

  const toneBg: Record<string, string> = {
    danger: Colors.dangerSoft, warn: Colors.warnSoft, soon: Colors.accentSoft, neutral: Colors.surface2, muted: 'transparent',
  };
  const toneFg: Record<string, string> = {
    danger: Colors.dangerInk, warn: Colors.warnInk, soon: Colors.accentInk, neutral: Colors.ink2, muted: Colors.faint,
  };
  const bg = toneBg[s.tone] ?? Colors.surface2;
  const fg = toneFg[s.tone] ?? Colors.ink2;

  return (
    <View style={[styles.dayCounter, { backgroundColor: bg }]}>
      <Text style={[styles.dayCounterBig, { color: fg }]}>{big}</Text>
      <View style={{ gap: 3 }}>
        <Text style={[styles.dayCounterLabel, { color: fg }]}>{s.label}</Text>
        <Text style={[styles.dayCounterSub, { color: fg }]}>{small}</Text>
      </View>
    </View>
  );
}

interface DatePickerProps {
  title: string;
  date?: Date | null;
  time?: string;
  withTime?: boolean;
  onSave: (d: Date, t?: string) => void;
  onClear?: () => void;
  onClose: () => void;
}

function DatePickerSheet({ title, date, time, withTime, onSave, onClear, onClose }: DatePickerProps) {
  const today = todayD();
  const init = date ? new Date(date) : today;
  const [sel, setSel] = useState(startOfDay(init));
  const [cur, setCur] = useState({ y: init.getFullYear(), m: init.getMonth() });
  const [tm, setTm] = useState<string | null>(time ?? null);
  const grid = monthGrid(cur.y, cur.m);
  const shift = (n: number) => setCur(c => { const d = new Date(c.y, c.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const TIMES: [string, string | null][] = [['Aucune', null], ['09:00', '09:00'], ['12:00', '12:00'], ['16:00', '16:00'], ['18:30', '18:30'], ['20:00', '20:00']];
  const quick: [string, number][] = [["Aujourd'hui", 0], ['Demain', 1], ['Dans 1 sem.', 7]];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[styles.panel, { maxHeight: '85%' }]}>
          <View style={styles.handle} />
          <View style={styles.datePickerHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            {onClear && <TouchableOpacity onPress={onClear} activeOpacity={0.7}><Text style={{ color: Colors.danger, fontWeight: '700', fontSize: 13.5 }}>Effacer</Text></TouchableOpacity>}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick buttons */}
            <View style={styles.quickRow}>
              {quick.map(([label, n]) => (
                <TouchableOpacity key={label} onPress={() => { const d = addDays(today, n); setSel(d); setCur({ y: d.getFullYear(), m: d.getMonth() }); }} style={styles.quickBtn} activeOpacity={0.7}>
                  <Text style={styles.quickBtnText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Month nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => shift(-1)} style={styles.navBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 18, color: Colors.ink2 }}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS[cur.m]} {cur.y}</Text>
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
                  const on = startOfDay(d).getTime() === startOfDay(sel).getTime();
                  const isTdy = startOfDay(d).getTime() === today.getTime();
                  return (
                    <TouchableOpacity key={di} onPress={() => setSel(startOfDay(d))} style={styles.dayCell} activeOpacity={0.7}>
                      <View style={[styles.dayNum, on && { backgroundColor: Colors.accent }, isTdy && !on && { backgroundColor: Colors.accentSoft }]}>
                        <Text style={[styles.dayNumText, on && { color: '#fff' }, isTdy && !on && { color: Colors.accentInk }]}>{d.getDate()}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            {/* Time picker */}
            {withTime && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.timeHeader}>Heure d'échéance</Text>
                <View style={styles.timeRow}>
                  {TIMES.map(([label, val]) => (
                    <TouchableOpacity key={label} onPress={() => setTm(val)} style={[styles.timeChip, tm === val && { backgroundColor: Colors.ink }]} activeOpacity={0.7}>
                      <Text style={[styles.timeChipText, tm === val && { color: '#fff' }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Btn kind="primary" size="lg" onPress={() => onSave(sel, withTime ? (tm ?? undefined) : undefined)} style={{ marginTop: 18 }}>Enregistrer</Btn>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RecurPickerSheet({ recur, onClose, onSave }: { recur?: RecurRule; onClose: () => void; onSave: (r: RecurRule | null) => void }) {
  const presets: { label: string; val: RecurRule | null }[] = [
    { label: 'Ne se répète pas', val: null },
    { label: 'Tous les jours', val: { every: 1, freq: 'day', label: 'Chaque jour' } },
    { label: 'Chaque semaine', val: { every: 1, freq: 'week', label: 'Chaque semaine' } },
    { label: 'Toutes les 2 semaines', val: { every: 2, freq: 'week', label: 'Toutes les 2 semaines' } },
    { label: 'Chaque mois', val: { every: 1, freq: 'month', label: 'Chaque mois' } },
    { label: 'Chaque année', val: { every: 1, freq: 'year', label: 'Chaque année' } },
  ];
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[styles.panel, { maxHeight: '60%' }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Récurrence</Text>
          {presets.map((p, i) => (
            <TouchableOpacity key={i} onPress={() => onSave(p.val)} style={styles.recurRow} activeOpacity={0.7}>
              <Text style={styles.recurLabel}>{p.label}</Text>
              {(!recur && !p.val) || (recur && p.val && recur.label === p.val.label)
                ? <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>
                : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function TagPickerSheet({ selected, onClose, onSave }: { selected: string[]; onClose: () => void; onSave: (t: string[]) => void }) {
  const [sel, setSel] = useState(selected ?? []);
  const toggle = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[styles.panel, { maxHeight: '55%' }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Étiquettes</Text>
          <View style={styles.tagPickerRow}>
            {Object.values(TAGS).map(tag => {
              const on = sel.includes(tag.id);
              return (
                <TouchableOpacity key={tag.id} onPress={() => toggle(tag.id)} activeOpacity={0.7}
                  style={[styles.tagPickerChip, { backgroundColor: on ? tag.color : tag.color + '20' }]}>
                  <Text style={[styles.tagPickerText, { color: on ? '#fff' : tag.color }]}>{tag.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Btn kind="primary" size="lg" onPress={() => onSave(sel)} style={{ marginTop: 20 }}>Enregistrer</Btn>
        </View>
      </View>
    </Modal>
  );
}

function ProjectPickerSheet({ value, onClose, onSave }: { value: string; onClose: () => void; onSave: (p: string) => void }) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[styles.panel, { maxHeight: '60%' }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Déplacer vers</Text>
          {PROJECTS.map(p => (
            <TouchableOpacity key={p.id} onPress={() => onSave(p.id)} style={styles.pickerRow} activeOpacity={0.7}>
              <View style={styles.projPickerEmoji}><Text style={{ fontSize: 19 }}>{p.emoji}</Text></View>
              <Text style={styles.pickerLabel}>{p.name}</Text>
              {value === p.id && <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function AssigneePickerSheet({ value, onClose, onSave }: { value?: string; onClose: () => void; onSave: (a: string | null) => void }) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[styles.panel, { maxHeight: '55%' }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Assigner à</Text>
          <TouchableOpacity onPress={() => onSave(null)} style={styles.pickerRow} activeOpacity={0.7}>
            <View style={[styles.projPickerEmoji, { borderRadius: 99 }]}><Text style={{ fontSize: 18, color: Colors.faint }}>👤</Text></View>
            <Text style={styles.pickerLabel}>Personne</Text>
            {!value && <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>}
          </TouchableOpacity>
          {Object.values(MEMBERS).map(m => (
            <TouchableOpacity key={m.id} onPress={() => onSave(m.id)} style={styles.pickerRow} activeOpacity={0.7}>
              <Avatar m={m} size={38} />
              <Text style={styles.pickerLabel}>{m.name}</Text>
              {value === m.id && <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function ReminderSheet({ onClose, onSave }: { onClose: () => void; onSave: (r: Reminder) => void }) {
  const opts = [
    { label: "À l'heure", value: 0, unit: 'min' as const },
    { label: '10 min avant', value: 10, unit: 'min' as const },
    { label: '30 min avant', value: 30, unit: 'min' as const },
    { label: '1 heure avant', value: 1, unit: 'hour' as const },
    { label: '2 heures avant', value: 2, unit: 'hour' as const },
    { label: '1 jour avant', value: 1, unit: 'day' as const },
    { label: '2 jours avant', value: 2, unit: 'day' as const },
  ];
  const [sel, setSel] = useState(opts[2]);
  const [ch, setCh] = useState<'push' | 'email'>('push');
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} onPress={onClose} activeOpacity={1} />
        <View style={[styles.panel, { maxHeight: '65%' }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Nouveau rappel</Text>
          <Text style={styles.timeHeader}>Quand</Text>
          <View style={styles.timeRow}>
            {opts.map(o => (
              <TouchableOpacity key={o.label} onPress={() => setSel(o)} style={[styles.timeChip, sel.label === o.label && { backgroundColor: Colors.accent }]} activeOpacity={0.7}>
                <Text style={[styles.timeChipText, sel.label === o.label && { color: '#fff' }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.timeHeader, { marginTop: 16 }]}>Canal</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['push', 'email'] as const).map(id => (
              <TouchableOpacity key={id} onPress={() => setCh(id)} activeOpacity={0.7}
                style={[styles.channelBtn, ch === id && { backgroundColor: Colors.accentSoft, borderColor: Colors.accent }]}>
                <Text style={[styles.channelBtnText, ch === id && { color: Colors.accentInk }]}>{id === 'email' ? '📧 E-mail' : '🔔 Push'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Btn kind="primary" size="lg" onPress={() => onSave({ value: sel.value, unit: sel.unit, channel: ch })} style={{ marginTop: 18 }}>Ajouter le rappel</Btn>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim:   { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,19,14,0.34)' },
  panel:   { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  handle:  { width: 38, height: 4.5, borderRadius: 99, backgroundColor: Colors.lineStrong, alignSelf: 'center', marginTop: 12, marginBottom: 14 },

  topBar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Space.md, paddingVertical: 12 },
  topActions:  { flexDirection: 'row', gap: 8 },
  iconBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },

  taskTitle:  { fontSize: 23, fontWeight: '800', color: Colors.ink, lineHeight: 30, marginVertical: 16 },
  doneBtn:    { height: 50, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  doneBtnText:{ fontSize: 15.5, fontWeight: '700', color: '#fff' },

  sectionTitle:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 4 },
  sectionTitleText: { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8 },
  actionLink:       { fontSize: 13, fontWeight: '700', color: Colors.accent },

  detailRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.line, gap: 12 },
  detailContent: { flex: 1, gap: 2 },
  detailLabel:   { fontSize: 12.5, color: Colors.muted, fontWeight: '600' },
  detailValue:   { fontSize: 15, fontWeight: '600', color: Colors.ink },
  detailSub:     { fontSize: 12.5, color: Colors.muted },

  reminderRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.line },
  reminderLabel:       { flex: 1, fontSize: 14.5, fontWeight: '600', color: Colors.ink },
  reminderChannel:     { backgroundColor: Colors.surface2, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  reminderChannelText: { fontSize: 12, fontWeight: '700', color: Colors.muted },
  emptyText:           { fontSize: 13.5, color: Colors.faint, paddingVertical: 6, paddingHorizontal: 4 },

  notes: { borderWidth: 1, borderColor: Colors.line, borderRadius: 12, padding: 12, fontSize: 14.5, lineHeight: 22, backgroundColor: Colors.surface2, color: Colors.ink, minHeight: 80, textAlignVertical: 'top' },

  comment:       { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentBubble: { flex: 1, backgroundColor: Colors.surface2, borderRadius: 12, borderTopLeftRadius: 3, padding: 10 },
  commentHeader: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 2 },
  commentName:   { fontWeight: '700', fontSize: 13.5, color: Colors.ink },
  commentTime:   { fontSize: 11.5, color: Colors.faint },
  commentText:   { fontSize: 14, lineHeight: 20, color: Colors.ink },
  commentInput:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: Colors.lineStrong, gap: 8 },
  commentField:  { flex: 1, fontSize: 14.5, color: Colors.ink },
  sendBtn:       { width: 36, height: 36, borderRadius: 99, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  historyRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  historyDot:  { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.lineStrong, flexShrink: 0 },
  historyText: { flex: 1, fontSize: 13, color: Colors.muted },
  historyName: { fontWeight: '600', color: Colors.ink2 },
  historyTime: { fontSize: 11.5, color: Colors.faint },

  dayCounter:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: Radius.lg },
  dayCounterBig:   { fontSize: 34, fontWeight: '700', lineHeight: 38, minWidth: 64 },
  dayCounterLabel: { fontSize: 15, fontWeight: '700' },
  dayCounterSub:   { fontSize: 13, opacity: 0.75 },

  sheetTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink, marginBottom: 16, paddingHorizontal: Space.md },

  datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Space.md, marginBottom: 12 },
  quickRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: Space.md, marginBottom: 12 },
  quickBtn:  { flex: 1, height: 36, borderRadius: 10, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: Colors.accentInk },
  monthNav:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Space.md, marginBottom: 8 },
  navBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  monthLabel:{ fontSize: 15.5, fontWeight: '700', color: Colors.ink },
  dayHeaders:{ flexDirection: 'row', paddingHorizontal: Space.md },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11.5, fontWeight: '700', color: Colors.faint, paddingVertical: 4 },
  weekRow:   { flexDirection: 'row', paddingHorizontal: Space.md },
  dayCell:   { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  dayNum:    { width: 32, height: 32, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  dayNumText:{ fontSize: 14, fontWeight: '500', color: Colors.ink2 },
  timeHeader:{ fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: Space.md, marginBottom: 8 },
  timeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: Space.md },
  timeChip:  { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: Colors.surface2 },
  timeChipText: { fontSize: 13.5, fontWeight: '600', color: Colors.ink2 },

  recurRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: Space.md, borderBottomWidth: 1, borderBottomColor: Colors.line },
  recurLabel:{ fontSize: 15.5, fontWeight: '600', color: Colors.ink },

  tagPickerRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Space.md },
  tagPickerChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99 },
  tagPickerText: { fontSize: 14, fontWeight: '700' },

  pickerRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: Space.md, borderBottomWidth: 1, borderBottomColor: Colors.line },
  projPickerEmoji:  { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  pickerLabel:      { flex: 1, fontSize: 15.5, fontWeight: '600', color: Colors.ink },

  priorityRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: Space.md, borderRadius: 10 },
  priorityDot:   { width: 10, height: 10, borderRadius: 99 },
  priorityLabel: { flex: 1, fontSize: 15.5, fontWeight: '600' },
  priorityShort: { fontSize: 12, fontWeight: '700', color: Colors.muted },

  channelBtn:     { flex: 1, height: 46, borderRadius: 12, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  channelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.ink2 },
});
