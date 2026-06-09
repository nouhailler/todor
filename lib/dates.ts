import type { DueStatus, RecurRule } from '../store/types';

export const MONTHS       = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
export const MONTHS_SHORT = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
export const DOW_SHORT    = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
export const DOW_HEAD     = ['L','M','M','J','V','S','D'];

export function startOfDay(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

export function todayD(): Date {
  return startOfDay(new Date());
}

export function addDays(d: Date, n: number): Date {
  const x = startOfDay(d); x.setDate(x.getDate() + n); return x;
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function fmtDate(d: Date): string {
  const x = new Date(d);
  return `${DOW_SHORT[x.getDay()]} ${x.getDate()} ${MONTHS_SHORT[x.getMonth()]}`;
}

export function fmtLong(d: Date): string {
  const x = new Date(d);
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
}

export function fmtDayLabel(d: Date, today: Date): string {
  const n = diffDays(today, d);
  if (n === 0) return "Aujourd'hui";
  if (n === 1) return 'Demain';
  if (n === -1) return 'Hier';
  return fmtDate(d);
}

export function dueStatus(due: Date | null | undefined, done: boolean, today?: Date): DueStatus {
  const t = today ?? todayD();
  if (done) return { key: 'done', tone: 'muted', label: 'Fait', sub: '', icon: 'check', n: 0 };
  if (!due)  return { key: 'none', tone: 'muted', label: 'Sans date', sub: '', icon: 'calendar', n: 0 };
  const n = diffDays(t, due);
  if (n < 0)  return { key: 'overdue',  tone: 'danger',  label: 'En retard',   sub: `${-n} j`,      icon: 'alert',    n };
  if (n === 0) return { key: 'today',   tone: 'warn',    label: "Aujourd'hui", sub: '',             icon: 'sun',      n };
  if (n === 1) return { key: 'tomorrow',tone: 'soon',    label: 'Demain',      sub: '',             icon: 'calendar', n };
  if (n <= 7)  return { key: 'soon',    tone: 'soon',    label: `J‑${n}`,      sub: `dans ${n} j`,  icon: 'calendar', n };
  return       { key: 'later',          tone: 'neutral', label: fmtDate(due),  sub: '',             icon: 'calendar', n };
}

export function nextDue(date: Date, recur: RecurRule): Date {
  const d = new Date(date);
  const e = recur.every ?? 1;
  if      (recur.freq === 'day')   d.setDate(d.getDate() + e);
  else if (recur.freq === 'week')  d.setDate(d.getDate() + 7 * e);
  else if (recur.freq === 'month') d.setMonth(d.getMonth() + e);
  else if (recur.freq === 'year')  d.setFullYear(d.getFullYear() + e);
  else                             d.setDate(d.getDate() + e);
  return startOfDay(d);
}

export function monthGrid(year: number, month: number): (Date | null)[][] {
  const first    = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon = 0
  const days     = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
