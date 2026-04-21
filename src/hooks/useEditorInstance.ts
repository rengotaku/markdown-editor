import type { Editor } from "@tiptap/react";
import { create } from "zustand";

interface EditorInstanceState {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
}

export const useEditorInstance = create<EditorInstanceState>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
}));
