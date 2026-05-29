import { create } from 'zustand'

interface SearchStore {
  globalSearch: string
  setGlobalSearch: (v: string) => void
}

export const useSearchStore = create<SearchStore>(set => ({
  globalSearch: '',
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
}))
