import { create } from "zustand";
import { simpleHash } from "@/utils/hash";
import { useRecentFiles, type RecentFile } from "./useRecentFiles";

export interface Folder {
  id: string;
  name: string;
  childIds: string[];
  expanded: boolean;
}

export interface OpenFile {
  id: string;
  name: string;
  path: string;
  markdown: string;
  isDirty: boolean;
  reloadToken: number;
  initialHash: string;
  folderId?: string;
}

export interface IncomingFile {
  name: string;
  path?: string;
  markdown: string;
}

interface OpenFilesState {
  files: OpenFile[];
  folders: Folder[];
  rootOrder: string[];
  activeId: string | null;
  addFiles: (incoming: IncomingFile[]) => void;
  addFilesInNewFolder: (incoming: IncomingFile[], folderName: string) => void;
  overwriteFiles: (incoming: IncomingFile[]) => void;
  updateActiveMarkdown: (markdown: string) => void;
  setActive: (id: string) => void;
  closeFile: (id: string) => void;
  closeAll: () => void;
  createUntitled: () => void;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  moveFileToFolder: (fileId: string, folderId: string) => void;
  moveFileToRoot: (fileId: string) => void;
  openRecent: (recent: RecentFile) => void;
}

const UNTITLED_BASE = "untitled";
const UNTITLED_EXT = ".md";

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
  const name = nextUntitledName(existing);
  return {
    id: generateId(),
    name,
    path: name,
    markdown: "",
    isDirty: false,
    reloadToken: 0,
    initialHash: simpleHash(""),
  };
}

function buildOpenFile(item: IncomingFile, folderId?: string): OpenFile {
  return {
    id: generateId(),
    name: item.name,
    path: item.path ?? item.name,
    markdown: item.markdown,
    isDirty: false,
    reloadToken: 0,
    initialHash: simpleHash(item.markdown),
    folderId,
  };
}

function recordRecent(items: { name: string; path: string; markdown: string }[]): void {
  useRecentFiles.getState().record(items);
}

const initialUntitled = buildUntitledFile(new Set());

export const useOpenFiles = create<OpenFilesState>()((set, get) => ({
  files: [initialUntitled],
  folders: [],
  rootOrder: [initialUntitled.id],
  activeId: initialUntitled.id,

  addFiles: (incoming) =>
    set((state) => {
      if (incoming.length === 0) return state;
      const created = incoming.map((item) => buildOpenFile(item));
      recordRecent(
        created.map((f) => ({ name: f.name, path: f.path, markdown: f.markdown }))
      );
      const files = [...state.files, ...created];
      const rootOrder = [...(state.rootOrder ?? []), ...created.map((f) => f.id)];
      return { files, rootOrder, activeId: created[0].id };
    }),

  addFilesInNewFolder: (incoming, folderName) =>
    set((state) => {
      if (incoming.length === 0) return state;
      const folderId = generateId();
      const created = incoming.map((item) => buildOpenFile(item, folderId));
      recordRecent(
        created.map((f) => ({ name: f.name, path: f.path, markdown: f.markdown }))
      );
      const folder: Folder = {
        id: folderId,
        name: folderName,
        childIds: created.map((f) => f.id),
        expanded: true,
      };
      return {
        files: [...state.files, ...created],
        folders: [...state.folders, folder],
        rootOrder: [...(state.rootOrder ?? []), folderId],
        activeId: created[0].id,
      };
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
      const firstOverwritten = files.find((f) => byName.has(f.name));
      return {
        files,
        activeId: firstOverwritten ? firstOverwritten.id : state.activeId,
      };
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

  closeFile: (id) => {
    const closing = get().files.find((file) => file.id === id);
    if (closing) {
      recordRecent([
        { name: closing.name, path: closing.path, markdown: closing.markdown },
      ]);
    }
    set((state) => {
      const index = state.files.findIndex((file) => file.id === id);
      if (index === -1) return state;
      const fileToClose = state.files[index];
      const remaining = state.files.filter((file) => file.id !== id);

      const folders = fileToClose.folderId
        ? state.folders.map((folder) =>
            folder.id === fileToClose.folderId
              ? { ...folder, childIds: folder.childIds.filter((cid) => cid !== id) }
              : folder
          )
        : state.folders;

      const rootOrder = state.rootOrder.filter((rid) => rid !== id);

      if (remaining.length === 0) {
        const fresh = buildUntitledFile(new Set());
        return {
          files: [fresh],
          folders: [],
          rootOrder: [fresh.id],
          activeId: fresh.id,
        };
      }
      let activeId = state.activeId;
      if (state.activeId === id) {
        const nextIndex = Math.min(index, remaining.length - 1);
        activeId = remaining[nextIndex].id;
      }
      return { files: remaining, folders, rootOrder, activeId };
    });
  },

  closeAll: () => {
    recordRecent(
      get().files.map((f) => ({ name: f.name, path: f.path, markdown: f.markdown }))
    );
    set(() => {
      const fresh = buildUntitledFile(new Set());
      return {
        files: [fresh],
        folders: [],
        rootOrder: [fresh.id],
        activeId: fresh.id,
      };
    });
  },

  createUntitled: () =>
    set((state) => {
      const existing = new Set(state.files.map((f) => f.name));
      const fresh = buildUntitledFile(existing);
      return {
        files: [...state.files, fresh],
        rootOrder: [...(state.rootOrder ?? []), fresh.id],
        activeId: fresh.id,
      };
    }),

  renameFolder: (folderId, name) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
    })),

  deleteFolder: (folderId) =>
    set((state) => {
      const folder = state.folders.find((f) => f.id === folderId);
      if (!folder) return state;
      const files = state.files.map((f) =>
        f.folderId === folderId ? { ...f, folderId: undefined } : f
      );
      const rootOrder = state.rootOrder.flatMap((id) =>
        id === folderId ? folder.childIds : [id]
      );
      return {
        files,
        folders: state.folders.filter((f) => f.id !== folderId),
        rootOrder,
      };
    }),

  toggleFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === folderId ? { ...f, expanded: !f.expanded } : f
      ),
    })),

  moveFileToFolder: (fileId, folderId) =>
    set((state) => {
      const file = state.files.find((f) => f.id === fileId);
      const targetFolder = state.folders.find((f) => f.id === folderId);
      if (!file || !targetFolder || file.folderId === folderId) return state;

      let folders = state.folders;
      if (file.folderId) {
        folders = folders.map((f) =>
          f.id === file.folderId
            ? { ...f, childIds: f.childIds.filter((id) => id !== fileId) }
            : f
        );
      }
      folders = folders.map((f) =>
        f.id === folderId ? { ...f, childIds: [...f.childIds, fileId] } : f
      );

      const files = state.files.map((f) => (f.id === fileId ? { ...f, folderId } : f));
      const rootOrder = state.rootOrder.filter((id) => id !== fileId);
      return { files, folders, rootOrder };
    }),

  moveFileToRoot: (fileId) =>
    set((state) => {
      const file = state.files.find((f) => f.id === fileId);
      if (!file || !file.folderId) return state;

      const folders = state.folders.map((f) =>
        f.id === file.folderId
          ? { ...f, childIds: f.childIds.filter((id) => id !== fileId) }
          : f
      );
      const files = state.files.map((f) =>
        f.id === fileId ? { ...f, folderId: undefined } : f
      );
      const rootOrder = [...state.rootOrder, fileId];
      return { files, folders, rootOrder };
    }),

  openRecent: (recent) =>
    set((state) => {
      const existing = state.files.find((f) => f.path === recent.path);
      if (existing) return { activeId: existing.id };
      const created = buildOpenFile({
        name: recent.name,
        path: recent.path,
        markdown: recent.markdown,
      });
      return {
        files: [...state.files, created],
        rootOrder: [...(state.rootOrder ?? []), created.id],
        activeId: created.id,
      };
    }),
}));
