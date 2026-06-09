import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, todayD } from '../lib/dates';
import { PROJECTS as SEED_PROJECTS, SEED_TASKS } from '../constants/data';
import { nextDue } from '../lib/dates';
import { getAllProjects } from './projectStore';
import type { Task, RecurRule } from './types';

const uid = () => 'x' + Math.random().toString(36).slice(2, 9);

function patchMeta(t: Task): Task {
  const p = getAllProjects().find(x => x.id === t.project);
  if (!p) return t;
  return { ...t, color: p.color, emoji: p.emoji, projectName: p.name };
}

function logHist(t: Task, action: string): Task {
  return { ...t, history: [...(t.history ?? []), { by: 'me', action, at: new Date() }] };
}

export function hydrateNew(partial: Partial<Task>): Task {
  const all = getAllProjects();
  const p = all.find(x => x.id === partial.project) ?? all[0] ?? SEED_PROJECTS[0];
  return {
    id: uid(), text: '', notes: '', project: p.id, section: undefined, tags: [], priority: 0,
    done: false, archived: false, favorite: false,
    by: 'me', assignee: undefined, capture: undefined, recur: undefined,
    reminders: [], comments: [],
    created: todayD(), start: null, due: null, time: undefined,
    color: p.color, emoji: p.emoji, projectName: p.name,
    history: [{ by: 'me', action: 'a créé la tâche', at: new Date() }],
    ...partial,
  };
}

function hydrateSeed(): Task[] {
  const t0 = todayD();
  return SEED_TASKS.map((s: Record<string, unknown>) => {
    const p = SEED_PROJECTS.find(x => x.id === s.project) ?? SEED_PROJECTS[0];
    const created = s.createdOff != null ? addDays(t0, s.createdOff as number) : t0;
    const start   = s.startOff   != null ? addDays(t0, s.startOff   as number) : null;
    const due     = s.dueOff     != null ? addDays(t0, s.dueOff     as number) : null;

    const rawComments  = Array.isArray(s.comments)  ? s.comments  : [];
    const rawHistory   = Array.isArray(s.history)   ? s.history   : [];

    const comments = rawComments.map((c: Record<string, unknown>) => ({
      by: c.by as string, text: c.text as string,
      at: c.atOff != null ? addDays(t0, c.atOff as number) : new Date(),
    }));
    const history = rawHistory.length > 0
      ? rawHistory.map((h: Record<string, unknown>) => ({
          by: h.by as string, action: h.action as string,
          at: h.atOff != null ? addDays(t0, h.atOff as number) : new Date(),
        }))
      : [{ by: 'me', action: 'a créé la tâche', at: created }];

    return {
      id: s.id as string,
      text: s.text as string,
      notes: typeof s.notes === 'string' ? s.notes : undefined,
      project: p.id,
      section: typeof s.section === 'string' ? s.section : undefined,
      tags: Array.isArray(s.tags) ? s.tags as string[] : [],
      priority: (s.priority as Task['priority']) ?? 0,
      done: !!s.done,
      archived: false,
      favorite: !!s.favorite,
      by: s.by as string ?? 'me',
      assignee: typeof s.assignee === 'string' ? s.assignee : undefined,
      capture: s.capture as Task['capture'],
      recur: s.recur as Task['recur'],
      reminders: Array.isArray(s.reminders) ? s.reminders as Task['reminders'] : [],
      comments,
      history,
      created,
      start,
      due,
      time: typeof s.time === 'string' ? s.time : undefined,
      color: p.color,
      emoji: p.emoji,
      projectName: p.name,
    };
  });
}

interface TaskState {
  tasks: Task[];
  _seeded: boolean;
  addTask: (partial: Partial<Task>) => Task;
  bulkAdd: (tasks: Task[]) => void;
  update: (id: string, patch: Partial<Task>, action?: string) => void;
  toggleDone: (id: string) => void;
  remove: (id: string) => void;
  archive: (id: string, v?: boolean) => void;
  toggleFav: (id: string) => void;
  addComment: (id: string, text: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      _seeded: false,

      addTask: (partial) => {
        const nt = patchMeta(hydrateNew(partial));
        set(s => ({ tasks: [nt, ...s.tasks] }));
        return nt;
      },

      bulkAdd: (arr) => set(s => ({ tasks: [...arr.map(patchMeta), ...s.tasks] })),

      update: (id, patch, action) => set(s => ({
        tasks: s.tasks.map(t => {
          if (t.id !== id) return t;
          let nt = patchMeta({ ...t, ...patch });
          if (action) nt = logHist(nt, action);
          return nt;
        }),
      })),

      toggleDone: (id) => set(s => {
        const t = s.tasks.find(x => x.id === id);
        if (!t) return s;
        const becomingDone = !t.done;
        let next = s.tasks.map(x =>
          x.id === id
            ? logHist({ ...x, done: becomingDone }, becomingDone ? 'a terminé la tâche' : 'a réactivé la tâche')
            : x
        );
        if (becomingDone && t.recur && t.due) {
          const nd = nextDue(t.due, t.recur as RecurRule);
          const occ = patchMeta(hydrateNew({
            ...t, id: uid(), done: false, due: nd, start: null,
            comments: [], history: [{ by: 'me', action: 'récurrence générée', at: new Date() }],
          }));
          next = [...next, occ];
        }
        return { tasks: next };
      }),

      remove: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),

      archive: (id, v = true) => set(s => ({
        tasks: s.tasks.map(t => {
          if (t.id !== id) return t;
          return logHist({ ...t, archived: v }, v ? 'a archivé la tâche' : 'a désarchivé la tâche');
        }),
      })),

      toggleFav: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t),
      })),

      addComment: (id, text) => set(s => ({
        tasks: s.tasks.map(t =>
          t.id === id
            ? { ...t, comments: [...(t.comments ?? []), { by: 'me', text, at: new Date() }] }
            : t
        ),
      })),
    }),
    {
      name: 'todor-tasks',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && !state._seeded) {
          state.tasks = hydrateSeed();
          state._seeded = true;
        }
      },
    }
  )
);
