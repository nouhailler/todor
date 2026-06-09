import { Colors } from './tokens';
import type { Member, Tag, Folder, Project } from '../store/types';

export const MEMBERS: Record<string, Member> = {
  me:   { id: 'me',   name: 'Toi',   color: Colors.accent,  initials: 'T' },
  lea:  { id: 'lea',  name: 'Léa',   color: Colors.berry,   initials: 'L' },
  marc: { id: 'marc', name: 'Marc',  color: Colors.sky,     initials: 'M' },
  jo:   { id: 'jo',   name: 'Jonas', color: Colors.amber,   initials: 'J' },
};

export const PRIORITIES: Record<number, { n: number; label: string; short: string; color: string; soft: string; ink: string }> = {
  5: { n: 5, label: 'Critique',    short: 'P1', color: '#D6493F', soft: '#FBEAE8', ink: '#99291F' },
  4: { n: 4, label: 'Élevée',      short: 'P2', color: '#E2873C', soft: '#FBF0E2', ink: '#8A4E16' },
  3: { n: 3, label: 'Normale',     short: 'P3', color: '#4C8FD0', soft: '#E9F1FB', ink: '#26588F' },
  2: { n: 2, label: 'Faible',      short: 'P4', color: '#8C897D', soft: '#F1F0EC', ink: '#56544B' },
  1: { n: 1, label: 'Très faible', short: 'P5', color: '#B6B2A6', soft: '#F4F3EF', ink: '#6F6E66' },
};

export const TAGS: Record<string, Tag> = {
  urgent:  { id: 'urgent',  label: 'Urgent',  color: '#D6493F' },
  famille: { id: 'famille', label: 'Famille', color: '#B0568B' },
  maison:  { id: 'maison',  label: 'Maison',  color: '#4C8FD0' },
  courses: { id: 'courses', label: 'Courses', color: '#1B9A5C' },
  perso:   { id: 'perso',   label: 'Perso',   color: '#E2A33C' },
  rdv:     { id: 'rdv',     label: 'RDV',     color: '#7C6CD0' },
  budget:  { id: 'budget',  label: 'Budget',  color: '#5C8A74' },
};

export const FOLDERS: Folder[] = [
  { id: 'maison', name: 'Maison & famille', emoji: '🏡' },
  { id: 'perso',  name: 'Perso & loisirs',  emoji: '🌿' },
];

export const PROJECTS: Project[] = [
  { id: 'courses', name: 'Courses de la semaine', emoji: '🛒', color: Colors.accent,  folder: 'maison', kind: 'list',    shared: ['me','lea','marc','jo'], favorite: true,  sections: ['Frais','Fruits & légumes','Épicerie'] },
  { id: 'lea',     name: 'Anniversaire de Léa',   emoji: '🎂', color: Colors.berry,   folder: 'maison', kind: 'project', shared: ['me','marc','jo'],       favorite: true,  sections: [] },
  { id: 'maison',  name: 'Travaux & maison',      emoji: '🧰', color: Colors.sky,     folder: 'maison', kind: 'project', shared: ['me','marc'],            favorite: false, sections: [] },
  { id: 'weekend', name: 'Week-end à la mer',     emoji: '🏕️', color: Colors.amber,   folder: 'perso',  kind: 'project', shared: ['me','lea'],             favorite: false, sections: [] },
  { id: 'perso',   name: 'Mes tâches perso',      emoji: '✨', color: Colors.plum,    folder: 'perso',  kind: 'list',    shared: ['me'],                   favorite: false, sections: [] },
];

// Seed tasks — offsets in days from today, hydrated at boot
export const SEED_TASKS = [
  // Courses
  { id: 'c1',  text: 'Yaourts nature ×8',       project: 'courses', section: 'Frais',            tags: ['courses'], priority: 0, done: true,  by: 'lea',  createdOff: -2 },
  { id: 'c2',  text: 'Lait demi-écrémé ×2',     project: 'courses', section: 'Frais',            tags: ['courses'], priority: 0, done: true,  by: 'me',   createdOff: -1, capture: 'voice' },
  { id: 'c3',  text: 'Beurre doux',              project: 'courses', section: 'Frais',            tags: ['courses'], priority: 0, done: false, by: 'marc', createdOff: -1 },
  { id: 'c4',  text: 'Comté (un bon morceau)',   project: 'courses', section: 'Frais',            tags: ['courses'], priority: 0, done: false, by: 'lea',  createdOff: 0, capture: 'photo' },
  { id: 'c5',  text: "Gâteau d'anniversaire",    project: 'courses', section: 'Frais',            tags: ['famille','courses'], priority: 4, done: false, by: 'me', createdOff: -3, startOff: 0, dueOff: 2, time: '16:00', notes: "À récupérer chez le pâtissier, commande au nom de Léa." },
  { id: 'c6',  text: 'Bananes',                  project: 'courses', section: 'Fruits & légumes', tags: ['courses'], priority: 0, done: true,  by: 'me',   createdOff: -2 },
  { id: 'c7',  text: 'Tomates cerises',          project: 'courses', section: 'Fruits & légumes', tags: ['courses'], priority: 0, done: false, by: 'jo',   createdOff: -1 },
  { id: 'c8',  text: 'Salade roquette',          project: 'courses', section: 'Fruits & légumes', tags: ['courses'], priority: 0, done: false, by: 'lea',  createdOff: -1 },
  { id: 'c9',  text: 'Citrons ×3',               project: 'courses', section: 'Fruits & légumes', tags: ['courses'], priority: 0, done: false, by: 'me',   createdOff: -1, capture: 'voice' },
  { id: 'c10', text: 'Pâtes penne ×2',           project: 'courses', section: 'Épicerie',         tags: ['courses'], priority: 0, done: false, by: 'marc', createdOff: -1 },
  { id: 'c11', text: 'Café en grains',           project: 'courses', section: 'Épicerie',         tags: ['courses'], priority: 0, done: false, by: 'me',   createdOff: -1 },
  { id: 'c12', text: "Huile d'olive",            project: 'courses', section: 'Épicerie',         tags: ['courses'], priority: 0, done: false, by: 'jo',   createdOff: -1 },

  // Anniversaire de Léa
  { id: 't1', text: 'Commander le gâteau', project: 'lea', tags: ['famille','urgent'], priority: 5, done: false, by: 'me', assignee: 'me',
    createdOff: -8, startOff: -2, dueOff: -1, time: '18:00', notes: "Format 8 parts, sans fruits à coque (allergie Tom).",
    reminders: [{ value: 1, unit: 'day', channel: 'push' }, { value: 2, unit: 'hour', channel: 'email' }],
    comments: [{ by: 'marc', text: 'Je peux passer le prendre si besoin 👍', atOff: -1 }],
    history: [{ by: 'me', action: 'a créé la tâche', atOff: -8 }, { by: 'me', action: 'a mis la priorité en Critique', atOff: -2 }] },
  { id: 't2', text: 'Envoyer les invitations', project: 'lea', tags: ['famille'], priority: 3, done: true, by: 'lea', assignee: 'lea',
    createdOff: -10, startOff: -9, dueOff: -4, history: [{ by: 'lea', action: 'a terminé la tâche', atOff: -5 }] },
  { id: 't3', text: 'Acheter bougies & déco', project: 'lea', tags: ['famille'], priority: 3, done: false, by: 'jo', assignee: 'jo', createdOff: -6, startOff: 0, dueOff: 2 },
  { id: 't4', text: 'Réserver le restaurant', project: 'lea', tags: ['famille','rdv'], priority: 4, done: false, by: 'me', assignee: 'me',
    createdOff: -6, startOff: 1, dueOff: 5, time: '20:00', reminders: [{ value: 1, unit: 'day', channel: 'push' }],
    comments: [{ by: 'lea', text: "On était bien au Petit Jardin l'an dernier !", atOff: -2 }, { by: 'me', text: 'Bonne idée, je les appelle.', atOff: -1 }] },
  { id: 't5', text: 'Préparer la playlist', project: 'lea', tags: ['perso'], priority: 2, done: false, by: 'marc', assignee: 'marc', createdOff: -3, startOff: 5, dueOff: 9 },

  // Travaux & maison
  { id: 'm1', text: 'Appeler le plombier', project: 'maison', tags: ['maison','urgent','rdv'], priority: 5, done: false, by: 'me', assignee: 'me',
    createdOff: -4, startOff: -1, dueOff: 0, time: '09:00', notes: "Fuite sous l'évier de la cuisine.",
    reminders: [{ value: 30, unit: 'min', channel: 'push' }] },
  { id: 'm2', text: 'Commander la peinture', project: 'maison', tags: ['maison','budget'], priority: 3, done: false, by: 'marc', assignee: 'marc', createdOff: -7, startOff: -5, dueOff: -2 },
  { id: 'm3', text: 'Poncer la table basse', project: 'maison', tags: ['maison'], priority: 2, done: false, by: 'me', createdOff: -5, startOff: 1, dueOff: 4 },
  { id: 'm4', text: "Monter l'étagère", project: 'maison', tags: ['maison'], priority: 3, done: true, by: 'marc', createdOff: -9, startOff: -3, dueOff: -1 },
  { id: 'm5', text: 'Sortir les poubelles', project: 'maison', tags: ['maison'], priority: 2, done: false, by: 'me', assignee: 'me',
    createdOff: -14, dueOff: 0, time: '19:00', recur: { every: 1, freq: 'week' as const, label: 'Chaque semaine' }, reminders: [{ value: 2, unit: 'hour', channel: 'push' }] },

  // Week-end à la mer
  { id: 'w1', text: 'Réserver le gîte', project: 'weekend', tags: ['rdv','budget'], priority: 4, done: false, by: 'lea', assignee: 'lea', createdOff: -2, startOff: 0, dueOff: 1, time: '12:00' },
  { id: 'w2', text: 'Vérifier la voiture & le plein', project: 'weekend', tags: [], priority: 2, done: false, by: 'me', createdOff: -1, startOff: 10, dueOff: 13 },
  { id: 'w3', text: 'Préparer les sacs de plage', project: 'weekend', tags: [], priority: 1, done: false, by: 'lea', createdOff: -1, startOff: 12, dueOff: 14 },

  // Perso
  { id: 'p1', text: 'Payer le loyer', project: 'perso', tags: ['budget','perso'], priority: 4, done: false, by: 'me', assignee: 'me',
    createdOff: -20, dueOff: 3, recur: { every: 1, freq: 'month' as const, label: 'Chaque mois' }, reminders: [{ value: 2, unit: 'day', channel: 'email' }] },
  { id: 'p2', text: 'Séance de sport', project: 'perso', tags: ['perso'], priority: 2, done: false, by: 'me', favorite: true,
    createdOff: -30, dueOff: 1, time: '18:30', recur: { every: 1, freq: 'week' as const, label: 'Lun · Mer · Ven' } },
  { id: 'p3', text: 'Appeler Mamie', project: 'perso', tags: ['famille','perso'], priority: 3, done: false, by: 'me', favorite: true, createdOff: -5, dueOff: 0, time: '17:00' },
  { id: 'p4', text: 'Sauvegarder les photos', project: 'perso', tags: ['perso'], priority: 1, done: false, by: 'me', createdOff: -40, dueOff: 30, recur: { every: 1, freq: 'month' as const, label: 'Chaque mois' } },
];

export const AI_JSON_SAMPLE = `[
  {
    "text": "Préparer le dossier de location",
    "project": "perso",
    "priority": 4,
    "due": "+4",
    "time": "10:00",
    "tags": ["budget", "perso"],
    "notes": "Fiches de paie + avis d'imposition"
  },
  {
    "text": "Prendre RDV dentiste",
    "project": "perso",
    "priority": 3,
    "due": "+7",
    "tags": ["rdv"]
  }
]`;
