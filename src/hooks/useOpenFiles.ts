import { create } from "zustand";

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

interface OpenFilesState {
  files: OpenFile[];
  activeId: string | null;
  addFiles: (incoming: IncomingFile[]) => void;
  overwriteFiles: (incoming: IncomingFile[]) => void;
  updateActiveMarkdown: (markdown: string) => void;
  setActive: (id: string) => void;
  closeFile: (id: string) => void;
  closeAll: () => void;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useOpenFiles = create<OpenFilesState>((set) => ({
  files: [],
  activeId: null,

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
      const files = state.files.filter((file) => file.id !== id);
      let activeId = state.activeId;
      if (state.activeId === id) {
        if (files.length === 0) {
          activeId = null;
        } else {
          const nextIndex = Math.min(index, files.length - 1);
          activeId = files[nextIndex].id;
        }
      }
      return { files, activeId };
    }),

  closeAll: () => set({ files: [], activeId: null }),
}));
