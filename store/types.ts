export interface Reminder    { value: number; unit: 'min' | 'hour' | 'day'; channel: 'push' | 'email' }
export interface Comment     { by: string; text: string; at: Date }
export interface HistoryEntry{ by: string; action: string; at: Date }
export interface RecurRule   { every: number; freq: 'day' | 'week' | 'month' | 'year'; label: string }

export interface Task {
  id: string;
  text: string;
  notes?: string;
  project: string;
  section?: string;
  tags: string[];
  priority: 0 | 1 | 2 | 3 | 4 | 5;
  done: boolean;
  archived: boolean;
  favorite: boolean;
  by: string;
  assignee?: string;
  capture?: 'voice' | 'photo';
  recur?: RecurRule;
  reminders: Reminder[];
  comments: Comment[];
  history: HistoryEntry[];
  created: Date;
  start?: Date | null;
  due?: Date | null;
  time?: string;
  photo?: boolean;
  // denormalized from project
  color: string;
  emoji: string;
  projectName: string;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  folder: string;
  kind: 'list' | 'project';
  shared: string[];
  favorite: boolean;
  sections: string[];
}

export interface Member { id: string; name: string; color: string; initials: string }
export interface Tag    { id: string; label: string; color: string }
export interface Folder { id: string; name: string; emoji: string }

export type DueTone = 'danger' | 'warn' | 'soon' | 'neutral' | 'muted';
export type DueKey  = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later' | 'done' | 'none';

export interface DueStatus {
  key: DueKey;
  tone: DueTone;
  label: string;
  sub: string;
  icon: string;
  n: number;
}

export type SortKey     = 'smart' | 'priority' | 'due' | 'created' | 'alpha';
export type StatusFilter= 'active' | 'today' | 'overdue' | 'done' | 'archived';

export interface FilterState {
  status: StatusFilter;
  project?: string;
  tag?: string;
  assignee?: string;
  favorite?: boolean;
  priorityMin?: number;
}
