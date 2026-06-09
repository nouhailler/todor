import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaletteName } from '../constants/tokens';

interface SettingsState {
  palette: PaletteName;
  setPalette: (p: PaletteName) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      palette: 'Sprout',
      setPalette: (palette) => set({ palette }),
    }),
    {
      name: 'todor-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
