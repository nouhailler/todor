import { todayD, diffDays } from './dates';
import type { Task, FilterState, SortKey } from '../store/types';

function matchQuery(t: Task, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return [t.text, t.notes, t.projectName, t.tags.join(' ')].filter(Boolean).join(' ').toLowerCase().includes(lower);
}

export function filterTasks(tasks: Task[], query: string, f: FilterState): Task[] {
  const today = todayD();
  return tasks.filter(t => {
    if (t.archived && f.status !== 'archived') return false;
    if (!t.archived && f.status === 'archived') return false;
    if (f.status === 'active'  && t.done) return false;
    if (f.status === 'done'    && !t.done) return false;
    if (f.status === 'overdue' && !(t.due && !t.done && diffDays(today, t.due) < 0)) return false;
    if (f.status === 'today'   && !(t.due && diffDays(today, t.due) === 0)) return false;
    if (f.project && t.project !== f.project) return false;
    if (f.tag     && !t.tags.includes(f.tag)) return false;
    if (f.assignee && t.assignee !== f.assignee) return false;
    if (f.favorite && !t.favorite) return false;
    if (f.priorityMin && (t.priority ?? 0) < f.priorityMin) return false;
    if (!matchQuery(t, query)) return false;
    return true;
  });
}

export function sortTasks(tasks: Task[], key: SortKey): Task[] {
  const arr = tasks.slice();
  const dueVal = (t: Task) => (t.due ? +t.due : Infinity);
  const cmp: Record<SortKey, (a: Task, b: Task) => number> = {
    smart:    (a, b) => (b.priority - a.priority) || (dueVal(a) - dueVal(b)) || (+a.done - +b.done),
    priority: (a, b) => (b.priority - a.priority) || (dueVal(a) - dueVal(b)),
    due:      (a, b) => dueVal(a) - dueVal(b),
    created:  (a, b) => +b.created - +a.created,
    alpha:    (a, b) => a.text.localeCompare(b.text, 'fr'),
  };
  arr.sort(cmp[key] ?? cmp.smart);
  return arr;
}
