import { create } from 'zustand';
import { MessageSourceCitation, UserProfile } from '@mindvault/shared';

interface AppState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;

  selectedCitation: MessageSourceCitation | null;
  setSelectedCitation: (citation: MessageSourceCitation | null) => void;

  isCitationDrawerOpen: boolean;
  setCitationDrawerOpen: (open: boolean) => void;

  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  activeCollectionId: null,
  setActiveCollectionId: (id) => set({ activeCollectionId: id }),

  selectedCitation: null,
  setSelectedCitation: (citation) =>
    set({
      selectedCitation: citation,
      isCitationDrawerOpen: !!citation,
    }),

  isCitationDrawerOpen: false,
  setCitationDrawerOpen: (open) => set({ isCitationDrawerOpen: open }),

  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
}));
