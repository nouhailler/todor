import { Easing } from 'react-native-reanimated';

export const Timings = {
  sheetUp:  { duration: 340, easing: Easing.bezier(0.2, 0.8, 0.25, 1) },
  scrim:    { duration: 250, easing: Easing.ease },
  fadeUp:   { duration: 450, easing: Easing.bezier(0.2, 0.7, 0.3, 1) },
  checkPop: { duration: 280, easing: Easing.out(Easing.back(2)) },
  spin:     { duration: 700, easing: Easing.linear },
};

export const Stagger = {
  list: (index: number) => index * 50,
};
