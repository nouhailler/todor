import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { todayD, startOfDay, addDays } from './dates';
import { PROJECTS, TAGS } from '../constants/data';
import type { Task } from '../store/types';

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDueToken(tok: unknown): Date | null {
  if (!tok) return null;
  if (typeof tok === 'string') {
    if (/^[+-]\d+$/.test(tok)) return addDays(todayD(), parseInt(tok, 10));
    if (tok === 'today' || tok === "aujourd'hui") return todayD();
    if (tok === 'tomorrow' || tok === 'demain') return addDays(todayD(), 1);
    const d = new Date(tok);
    return isNaN(+d) ? null : startOfDay(d);
  }
  return null;
}

export function exportJSON(tasks: Task[]): string {
  const out = tasks.filter(t => !t.archived).map(t => ({
    text: t.text, project: t.project, priority: t.priority ?? 0,
    due: t.due ? isoDate(t.due) : null, time: t.time ?? null,
    start: t.start ? isoDate(t.start) : null,
    tags: t.tags ?? [], done: !!t.done, notes: t.notes ?? '',
    recur: t.recur ? t.recur.label : null, assignee: t.assignee ?? null,
  }));
  return JSON.stringify(out, null, 2);
}

export function exportCSV(tasks: Task[]): string {
  const PRIORITIES: Record<number, string> = { 1: 'Très faible', 2: 'Faible', 3: 'Normale', 4: 'Élevée', 5: 'Critique' };
  const head = ['Tâche','Projet','Priorité','Échéance','Heure','Étiquettes','Statut','Assigné'];
  const esc = (s: unknown) => `"${String(s == null ? '' : s).replace(/"/g, '""')}"`;
  const rows = tasks.filter(t => !t.archived).map(t => [
    t.text, t.projectName, PRIORITIES[t.priority] ?? '—',
    t.due ? isoDate(t.due) : '', t.time ?? '',
    t.tags.map(id => TAGS[id]?.label ?? id).join(' / '),
    t.done ? 'Terminée' : 'En cours',
    t.assignee ?? '',
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...rows].join('\n');
}

export async function exportPDF(tasks: Task[]): Promise<void> {
  const PRIO_LABEL: Record<number, string> = { 0: '—', 1: 'Très faible', 2: 'Faible', 3: 'Normale', 4: 'Élevée', 5: 'Critique' };
  const active = tasks.filter(t => !t.archived);
  const done   = active.filter(t => t.done).length;

  const rows = active.map(t => `
    <tr>
      <td>${t.text}</td>
      <td>${t.projectName}</td>
      <td>${PRIO_LABEL[t.priority] ?? '—'}</td>
      <td>${t.due ? isoDate(t.due) : '—'}</td>
      <td style="color:${t.done ? '#1B9A5C' : '#8C897D'}">${t.done ? '✓ Terminée' : 'En cours'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, Helvetica, sans-serif; color: #1B1A15; margin: 32px; }
  h1   { font-size: 26px; font-weight: 800; color: #1B1A15; margin-bottom: 4px; }
  p    { color: #8C897D; font-size: 13px; margin-top: 0; }
  table{ width: 100%; border-collapse: collapse; margin-top: 20px; }
  th   { background: #F4F2EC; font-size: 11px; text-transform: uppercase; letter-spacing: .8px;
         padding: 9px 12px; text-align: left; color: #8C897D; }
  td   { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #ECE9E1; }
  tr:last-child td { border-bottom: none; }
</style>
</head>
<body>
  <h1>todor · Tâches</h1>
  <p>${active.length} tâches · ${done} terminées · Exporté le ${isoDate(new Date())}</p>
  <table>
    <thead><tr><th>Tâche</th><th>Projet</th><th>Priorité</th><th>Échéance</th><th>Statut</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Exporter les tâches' });
}

export function parseImport(text: string): { ok: boolean; tasks?: Task[]; error?: string } {
  let data: unknown;
  try { data = JSON.parse(text); }
  catch (e: unknown) { return { ok: false, error: 'JSON invalide : ' + (e instanceof Error ? e.message : String(e)) }; }
  if (!Array.isArray(data)) return { ok: false, error: 'Le JSON doit être un tableau de tâches.' };

  const tasks: Task[] = data.map((raw: Record<string, unknown>) => {
    const proj = PROJECTS.find(p => p.id === raw.project || p.name === raw.project) ?? PROJECTS[0];
    const due  = parseDueToken(raw.due);
    return {
      id: 'x' + Math.random().toString(36).slice(2, 9),
      text: String(raw.text || 'Tâche sans titre'),
      notes: String(raw.notes || ''),
      project: proj.id,
      section: undefined,
      tags: (Array.isArray(raw.tags) ? raw.tags : []).filter((id: string) => TAGS[id]),
      priority: Math.max(0, Math.min(5, Number(raw.priority || 0))) as Task['priority'],
      done: !!raw.done,
      archived: false,
      favorite: false,
      by: 'me',
      assignee: typeof raw.assignee === 'string' ? raw.assignee : undefined,
      capture: undefined,
      recur: undefined,
      reminders: [],
      comments: [],
      history: [{ by: 'me', action: 'a créé la tâche', at: new Date() }],
      created: todayD(),
      start: parseDueToken(raw.start),
      due,
      time: typeof raw.time === 'string' ? raw.time : undefined,
      color: proj.color,
      emoji: proj.emoji,
      projectName: proj.name,
    };
  });

  return { ok: true, tasks };
}
