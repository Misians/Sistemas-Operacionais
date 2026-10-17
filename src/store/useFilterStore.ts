// src/store/useFilterStore.ts
import { create } from 'zustand';
import type { OSModule, ResourceCategory } from '../types/repository';

interface FilterState {
  selectedModule: OSModule | 'todos';
  selectedCategory: ResourceCategory | 'todas';
  searchQuery: string;
  setModule: (mod: OSModule | 'todos') => void;
  setCategory: (cat: ResourceCategory | 'todas') => void;
  setSearchQuery: (q: string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedModule: 'todos',
  selectedCategory: 'todas',
  searchQuery: '',
  setModule: (selectedModule) => set({ selectedModule }),
  setCategory: (selectedCategory) => set({ selectedCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));