import { useEffect } from "react";
import Box from "@mui/material/Box";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { useEditorStore } from "@/hooks/useEditorStore";
import { FloatingToolbar } from "./toolbar/FloatingToolbar";
import { SlashCommand } from "./extensions/SlashCommand";
import { MermaidBlock } from "./extensions/MermaidBlock";
import "./styles/editor.css";

export function TiptapEditor() {
  const content = useEditorStore((s) => s.content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing, or type / for commands...",
      }),
      Link.configure({ openOnClick: false }),
      Markdown.configure({
        transformPastedText: true,
        transformCopiedText: false,
      }),
      SlashCommand,
      MermaidBlock,
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      useEditorStore.getState().updateContent(ed.getJSON());
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        "& .ProseMirror": { minHeight: "100%" },
      }}
    >
      {editor && <FloatingToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </Box>
  );
}
