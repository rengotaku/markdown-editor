import { useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Markdown } from "tiptap-markdown";
import { useEditorStore } from "@/hooks/useEditorStore";
import { useEditorInstance } from "@/hooks/useEditorInstance";
import { useEditorPrefs } from "@/hooks/useEditorPrefs";
import { useFileDrop } from "@/hooks/useFileDrop";
import { FloatingToolbar } from "./toolbar/FloatingToolbar";
import { TableMenu } from "./toolbar/TableMenu";
import { SlashCommand } from "./extensions/SlashCommand";
import { MermaidBlock } from "./extensions/MermaidBlock";
import "./styles/editor.css";

export function TiptapEditor() {
  const content = useEditorStore((s) => s.content);
  const centered = useEditorPrefs((s) => s.centered);
  const containerRef = useRef<HTMLDivElement>(null);

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
      TaskList,
      TaskItem.configure({ nested: true }),
      SlashCommand,
      MermaidBlock,
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      useEditorStore.getState().updateContent(ed.getJSON());
    },
  });

  const handleDropMarkdown = useCallback(
    (markdownText: string) => {
      if (!editor) return;
      editor.commands.setContent(markdownText);
    },
    [editor]
  );

  const { isDragging, error, clearError } = useFileDrop({
    onDropMarkdown: handleDropMarkdown,
    targetRef: containerRef,
  });

  useEffect(() => {
    useEditorInstance.getState().setEditor(editor ?? null);
    return () => {
      useEditorInstance.getState().setEditor(null);
      editor?.destroy();
    };
  }, [editor]);

  return (
    <Box
      ref={containerRef}
      className={centered ? "editor-centered" : undefined}
      sx={{
        height: "100%",
        overflow: "auto",
        position: "relative",
        "& .ProseMirror": { minHeight: "100%" },
      }}
    >
      {editor && <FloatingToolbar editor={editor} />}
      {editor && <TableMenu editor={editor} />}
      {editor && (
        <DragHandle editor={editor} className="drag-handle" nested>
          <DragIndicatorIcon fontSize="small" />
        </DragHandle>
      )}
      <EditorContent editor={editor} />

      {isDragging && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(25, 118, 210, 0.08)",
            border: "2px dashed",
            borderColor: "primary.main",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              bgcolor: "background.paper",
              px: 3,
              py: 1.5,
              borderRadius: 1,
              boxShadow: 1,
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            マークダウンファイルをドロップして読み込み
          </Box>
        </Box>
      )}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={clearError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={clearError}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
