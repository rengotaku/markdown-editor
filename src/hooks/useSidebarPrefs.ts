import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarPrefsState {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export const useSidebarPrefs = create<SidebarPrefsState>()(
  persist(
    (set) => ({
      collapsed: true,
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: "markdown-editor-sidebar-prefs" }
  )
);
