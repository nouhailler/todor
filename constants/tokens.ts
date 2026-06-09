export const Colors = {
  bg:          '#F4F2EC',
  appBg:       '#FBFAF6',
  surface:     '#FFFFFF',
  surface2:    '#F6F4EE',
  line:        '#ECE9E1',
  lineStrong:  '#E0DCD1',
  ink:         '#1B1A15',
  ink2:        '#56554B',
  muted:       '#8C897D',
  faint:       '#B6B2A6',
  accent:      '#1B9A5C',
  accentPress: '#157B49',
  accentInk:   '#0C5733',
  accentSoft:  '#E6F4EC',
  accentSoft2: '#D6EEDF',
  danger:      '#D6493F',
  dangerSoft:  '#FBEAE8',
  dangerInk:   '#99291F',
  warn:        '#C2811A',
  warnSoft:    '#FAF0DC',
  warnInk:     '#875613',
  tomato:      '#E2674A',
  amber:       '#E2A33C',
  berry:       '#B0568B',
  sky:         '#4C8FD0',
  plum:        '#7C6CD0',
};

export const Radius = { sm: 12, md: 18, lg: 24, xl: 30, pill: 99 };
export const Space  = { xs: 8, sm: 12, md: 16, lg: 22 };

export const PALETTES = {
  Sprout: { accent: '#1B9A5C', press: '#157B49', ink: '#0C5733', soft: '#E6F4EC', soft2: '#D6EEDF' },
  Tomate: { accent: '#E2674A', press: '#C8503A', ink: '#8F3422', soft: '#FBEAE5', soft2: '#F6D8CF' },
  Indigo: { accent: '#3F73C4', press: '#335FA3', ink: '#234A82', soft: '#E8F0FB', soft2: '#D5E4F6' },
  Prune:  { accent: '#7C6CD0', press: '#6557B4', ink: '#463A86', soft: '#EEEBFA', soft2: '#E0DAF5' },
};

export type PaletteName = keyof typeof PALETTES;
