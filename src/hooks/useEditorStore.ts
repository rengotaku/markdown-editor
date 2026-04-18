import type { JSONContent } from "@tiptap/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to Markdown Editor" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Start writing your content here. Use the floating toolbar to format selected text, or type ",
        },
        { type: "text", marks: [{ type: "code" }], text: "/" },
        { type: "text", text: " for quick commands." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Features" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Bold",
                },
                { type: "text", text: ", " },
                {
                  type: "text",
                  marks: [{ type: "italic" }],
                  text: "italic",
                },
                { type: "text", text: ", and " },
                {
                  type: "text",
                  marks: [{ type: "strike" }],
                  text: "strikethrough",
                },
                { type: "text", text: " formatting" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Headings, lists, and blockquotes" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Code blocks" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Mermaid diagrams" }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Mermaid Diagram Example" }],
    },
    {
      type: "mermaidBlock",
      attrs: {
        code: "graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Do something]\n    B -->|No| D[Do something else]\n    C --> E[End]\n    D --> E",
      },
    },
  ],
};

interface EditorState {
  content: JSONContent;
  updateContent: (value: JSONContent) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      content: DEFAULT_CONTENT,
      updateContent: (value) => set({ content: value }),
    }),
    {
      name: "markdown-editor-storage",
      version: 1,
      migrate: () => ({ content: DEFAULT_CONTENT, updateContent: () => {} }),
    }
  )
);
