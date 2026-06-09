import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROJECTS as SEED } from '../constants/data';
import type { Project } from './types';

interface ProjectState {
  projects: Project[];
  addProject: (partial: Omit<Project, 'id'>) => Project;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: SEED,
      addProject: (partial) => {
        const proj: Project = {
          id: 'p' + Math.random().toString(36).slice(2, 8),
          ...partial,
        };
        set(s => ({ projects: [...s.projects, proj] }));
        return proj;
      },
    }),
    {
      name: 'todor-projects',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure seed projects are always present after code updates
        if (state) {
          const ids = new Set(state.projects.map(p => p.id));
          const missing = SEED.filter(p => !ids.has(p.id));
          if (missing.length) state.projects = [...missing, ...state.projects];
        }
      },
    }
  )
);

export function getAllProjects(): Project[] {
  return useProjectStore.getState().projects;
}
