import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
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
import { offset } from "@floating-ui/dom";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Markdown } from "tiptap-markdown";
import { useOpenFiles, type IncomingFile } from "@/hooks/useOpenFiles";
import { useEditorInstance } from "@/hooks/useEditorInstance";
import { useEditorPrefs } from "@/hooks/useEditorPrefs";
import { useFileDrop, type DroppedFile } from "@/hooks/useFileDrop";
import { TableMenu } from "./toolbar/TableMenu";
import { SlashCommand } from "./extensions/SlashCommand";
import { MermaidBlock } from "./extensions/MermaidBlock";
import "./styles/editor.css";

function getEditorMarkdown(editor: { storage: unknown }): string {
  const storage = editor.storage as {
    markdown?: { getMarkdown: () => string };
  };
  return storage.markdown?.getMarkdown() ?? "";
}

export function TiptapEditor() {
  const centered = useEditorPrefs((s) => s.centered);
  const activeId = useOpenFiles((s) => s.activeId);
  const activeReloadToken = useOpenFiles((s) => {
    const file = s.files.find((f) => f.id === s.activeId);
    return file ? file.reloadToken : 0;
  });
  const addFiles = useOpenFiles((s) => s.addFiles);
  const overwriteFiles = useOpenFiles((s) => s.overwriteFiles);
  const updateActiveMarkdown = useOpenFiles((s) => s.updateActiveMarkdown);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLoadedKeyRef = useRef<string | null>(null);

  const [pendingConflicts, setPendingConflicts] = useState<IncomingFile[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
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
    content: "",
    editable: true,
    onUpdate: ({ editor: ed }) => {
      if (!useOpenFiles.getState().activeId) return;
      updateActiveMarkdown(getEditorMarkdown(ed));
    },
  });

  const handleDropMarkdown = useCallback(
    (files: DroppedFile[]) => {
      const existingNames = new Set(useOpenFiles.getState().files.map((f) => f.name));
      const seen = new Set<string>();
      const conflicts: IncomingFile[] = [];
      const fresh: IncomingFile[] = [];
      for (const file of files) {
        if (existingNames.has(file.name)) {
          conflicts.push(file);
        } else if (seen.has(file.name)) {
          conflicts.push(file);
        } else {
          fresh.push(file);
          seen.add(file.name);
        }
      }
      if (fresh.length > 0) addFiles(fresh);
      if (conflicts.length > 0) {
        setPendingConflicts((prev) => mergeByName(prev, conflicts));
      }
    },
    [addFiles]
  );

  const { isDragging, error, clearError } = useFileDrop({
    onDropMarkdown: handleDropMarkdown,
    targetRef: containerRef,
  });

  const dragHandleNested = useMemo(() => ({ edgeDetection: "none" as const }), []);
  const dragHandlePosition = useMemo(
    () => ({
      placement: "left-start" as const,
      strategy: "absolute" as const,
      middleware: [offset(16)],
    }),
    []
  );

  useEffect(() => {
    useEditorInstance.getState().setEditor(editor ?? null);
    return () => {
      useEditorInstance.getState().setEditor(null);
      editor?.destroy();
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const key = activeId ? `${activeId}:${activeReloadToken}` : null;
    if (lastLoadedKeyRef.current === key) return;
    lastLoadedKeyRef.current = key;
    if (!activeId) return;
    const state = useOpenFiles.getState();
    const file = state.files.find((f) => f.id === state.activeId);
    if (file) {
      editor.commands.setContent(file.markdown);
    }
  }, [editor, activeId, activeReloadToken]);

  const confirmOverwrite = () => {
    overwriteFiles(pendingConflicts);
    setPendingConflicts([]);
  };

  const cancelOverwrite = () => setPendingConflicts([]);

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
      {editor && <TableMenu editor={editor} />}
      {editor && (
        <DragHandle
          editor={editor}
          className="drag-handle"
          nested={dragHandleNested}
          computePositionConfig={dragHandlePosition}
        >
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

      <Dialog open={pendingConflicts.length > 0} onClose={cancelOverwrite}>
        <DialogTitle>同一ファイルがあります</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            以下のファイルはすでに開いています。上書きしますか？
            <Box
              component="ul"
              sx={{ mt: 1, mb: 0, pl: 2, fontFamily: "monospace", fontSize: "0.875rem" }}
            >
              {pendingConflicts.map((c) => (
                <li key={c.name}>{c.name}</li>
              ))}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelOverwrite}>キャンセル</Button>
          <Button onClick={confirmOverwrite} color="primary" variant="contained">
            上書き
          </Button>
        </DialogActions>
      </Dialog>

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

function mergeByName(prev: IncomingFile[], next: IncomingFile[]): IncomingFile[] {
  const map = new Map<string, IncomingFile>();
  for (const item of prev) map.set(item.name, item);
  for (const item of next) map.set(item.name, item);
  return Array.from(map.values());
}
