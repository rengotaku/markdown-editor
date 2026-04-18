import { useEffect } from "react";
import Box from "@mui/material/Box";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Markdown } from "tiptap-markdown";
import { useEditorStore } from "@/hooks/useEditorStore";
import { FloatingToolbar } from "./toolbar/FloatingToolbar";
import { TableMenu } from "./toolbar/TableMenu";
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
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
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
      {editor && <TableMenu editor={editor} />}
      <EditorContent editor={editor} />
    </Box>
  );
}
