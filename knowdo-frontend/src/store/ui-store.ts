import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  activePage: string;
  currentKnowledgeBaseId: string | null;
  toggleSidebar: () => void;
  setActivePage: (page: string) => void;
  setCurrentKnowledgeBase: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activePage: 'home',
  currentKnowledgeBaseId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActivePage: (page) => set({ activePage: page }),
  setCurrentKnowledgeBase: (id) => set({ currentKnowledgeBaseId: id }),
}));
