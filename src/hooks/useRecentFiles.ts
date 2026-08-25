import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/utils/storage";

export const RECENT_LIMIT = 20;

const STORAGE_KEY = "markdown-editor-recent-files";

export interface RecentFile {
  path: string;
  name: string;
  markdown: string;
  openedAt: number;
}

export interface RecentInput {
  name: string;
  path?: string;
  markdown: string;
}

interface RecentFilesState {
  recents: RecentFile[];
  /** 開いた / 閉じたタイミングで履歴へ記録する（path で重複排除し、最新を先頭に置く）。 */
  record: (inputs: RecentInput[]) => void;
  remove: (path: string) => void;
  clear: () => void;
}

export const useRecentFiles = create<RecentFilesState>()(
  persist(
    (set) => ({
      recents: [],

      record: (inputs) =>
        set((state) => {
          const entries: RecentFile[] = inputs
            .filter((item) => item.markdown.trim() !== "")
            .map((item) => ({
              name: item.name,
              path: item.path ?? item.name,
              markdown: item.markdown,
              openedAt: Date.now(),
            }));
          if (entries.length === 0) return state;

          const incomingPaths = new Set(entries.map((e) => e.path));
          const kept = state.recents.filter((r) => !incomingPaths.has(r.path));
          return { recents: [...entries, ...kept].slice(0, RECENT_LIMIT) };
        }),

      remove: (path) =>
        set((state) => ({ recents: state.recents.filter((r) => r.path !== path) })),

      clear: () => set({ recents: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ recents: state.recents }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.recents = (state.recents ?? []).slice(0, RECENT_LIMIT);
      },
    }
  )
);
