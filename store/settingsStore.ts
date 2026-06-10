import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaletteName } from '../constants/tokens';

interface SettingsState {
  palette: PaletteName;
  setPalette: (p: PaletteName) => void;
  // Scan photo via OpenRouter (clé saisie dans Réglages → Assistant IA)
  openRouterKey: string;
  openRouterModel: string;
  setOpenRouter: (key: string, model: string) => void;
}

export const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-haiku-4.5';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      palette: 'Sprout',
      setPalette: (palette) => set({ palette }),
      openRouterKey: '',
      openRouterModel: DEFAULT_OPENROUTER_MODEL,
      setOpenRouter: (openRouterKey, openRouterModel) => set({ openRouterKey, openRouterModel }),
    }),
    {
      name: 'todor-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
