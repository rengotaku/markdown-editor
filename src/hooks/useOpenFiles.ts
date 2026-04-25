import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export interface OpenFile {
  id: string;
  name: string;
  markdown: string;
  isDirty: boolean;
  reloadToken: number;
}

export interface IncomingFile {
  name: string;
  markdown: string;
}

export type RenameResult =
  | { ok: true }
  | { ok: false; reason: "empty" | "duplicate" | "not-found" };

interface OpenFilesState {
  files: OpenFile[];
  activeId: string | null;
  addFiles: (incoming: IncomingFile[]) => void;
  overwriteFiles: (incoming: IncomingFile[]) => void;
  updateActiveMarkdown: (markdown: string) => void;
  setActive: (id: string) => void;
  closeFile: (id: string) => void;
  closeAll: () => void;
  createUntitled: () => void;
  renameFile: (id: string, name: string) => RenameResult;
}

const UNTITLED_BASE = "untitled";
const UNTITLED_EXT = ".md";
const STORAGE_KEY = "markdown-editor-open-files";

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextUntitledName(existing: Set<string>): string {
  const first = `${UNTITLED_BASE}${UNTITLED_EXT}`;
  if (!existing.has(first)) return first;
  let n = 2;
  while (existing.has(`${UNTITLED_BASE}-${n}${UNTITLED_EXT}`)) n++;
  return `${UNTITLED_BASE}-${n}${UNTITLED_EXT}`;
}

function buildUntitledFile(existing: Set<string>): OpenFile {
  return {
    id: generateId(),
    name: nextUntitledName(existing),
    markdown: "",
    isDirty: false,
    reloadToken: 0,
  };
}

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn(`[useOpenFiles] Failed to persist '${name}':`, error);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // noop
    }
  },
};

const initialUntitled = buildUntitledFile(new Set());

export const useOpenFiles = create<OpenFilesState>()(
  persist(
    (set, get) => ({
      files: [initialUntitled],
      activeId: initialUntitled.id,

      addFiles: (incoming) =>
        set((state) => {
          if (incoming.length === 0) return state;
          const created: OpenFile[] = incoming.map((item) => ({
            id: generateId(),
            name: item.name,
            markdown: item.markdown,
            isDirty: false,
            reloadToken: 0,
          }));
          const files = [...state.files, ...created];
          const activeId = state.activeId ?? created[0].id;
          return { files, activeId };
        }),

      overwriteFiles: (incoming) =>
        set((state) => {
          if (incoming.length === 0) return state;
          const byName = new Map(incoming.map((item) => [item.name, item.markdown]));
          const files = state.files.map((file) => {
            const markdown = byName.get(file.name);
            if (markdown === undefined) return file;
            return {
              ...file,
              markdown,
              isDirty: false,
              reloadToken: file.reloadToken + 1,
            };
          });
          return { files };
        }),

      updateActiveMarkdown: (markdown) =>
        set((state) => {
          if (!state.activeId) return state;
          const files = state.files.map((file) =>
            file.id === state.activeId
              ? { ...file, markdown, isDirty: file.isDirty || file.markdown !== markdown }
              : file
          );
          return { files };
        }),

      setActive: (id) =>
        set((state) => {
          if (!state.files.some((file) => file.id === id)) return state;
          if (state.activeId === id) return state;
          return { activeId: id };
        }),

      closeFile: (id) =>
        set((state) => {
          const index = state.files.findIndex((file) => file.id === id);
          if (index === -1) return state;
          const remaining = state.files.filter((file) => file.id !== id);
          if (remaining.length === 0) {
            const fresh = buildUntitledFile(new Set());
            return { files: [fresh], activeId: fresh.id };
          }
          let activeId = state.activeId;
          if (state.activeId === id) {
            const nextIndex = Math.min(index, remaining.length - 1);
            activeId = remaining[nextIndex].id;
          }
          return { files: remaining, activeId };
        }),

      closeAll: () =>
        set(() => {
          const fresh = buildUntitledFile(new Set());
          return { files: [fresh], activeId: fresh.id };
        }),

      createUntitled: () =>
        set((state) => {
          const existing = new Set(state.files.map((f) => f.name));
          const fresh = buildUntitledFile(existing);
          return { files: [...state.files, fresh], activeId: fresh.id };
        }),

      renameFile: (id, name) => {
        const trimmed = name.trim();
        if (trimmed.length === 0) return { ok: false, reason: "empty" };
        const state = get();
        const target = state.files.find((f) => f.id === id);
        if (!target) return { ok: false, reason: "not-found" };
        if (target.name === trimmed) return { ok: true };
        if (state.files.some((f) => f.id !== id && f.name === trimmed)) {
          return { ok: false, reason: "duplicate" };
        }
        set({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: trimmed } : f
          ),
        });
        return { ok: true };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        files: state.files,
        activeId: state.activeId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.files.length === 0) {
          const fresh = buildUntitledFile(new Set());
          state.files = [fresh];
          state.activeId = fresh.id;
          return;
        }
        if (!state.activeId || !state.files.some((f) => f.id === state.activeId)) {
          state.activeId = state.files[0].id;
        }
      },
    }
  )
);
