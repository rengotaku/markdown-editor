import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";

interface TableMenuProps {
  editor: Editor;
}

interface TablePosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useTablePosition(editor: Editor): TablePosition | null {
  const [position, setPosition] = useState<TablePosition | null>(null);

  const updatePosition = useCallback(() => {
    if (!editor.isActive("table")) {
      setPosition(null);
      return;
    }

    const tableEl = editor.view.dom.querySelector("table");
    if (!tableEl) {
      setPosition(null);
      return;
    }

    const rect = tableEl.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });
  }, [editor]);

  useEffect(() => {
    const handler = () => updatePosition();
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor, updatePosition]);

  return position;
}

export function TableMenu({ editor }: TableMenuProps) {
  const position = useTablePosition(editor);

  if (!position) {
    return null;
  }

  const menuBar = (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: position.top - 36,
        left: position.left,
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        zIndex: 1200,
      }}
    >
      <Tooltip title="Add column" arrow>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          aria-label="Add column"
        >
          <AddIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove column" arrow>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          aria-label="Remove column"
        >
          <RemoveIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
      <Tooltip title="Add row" arrow>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          aria-label="Add row"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove row" arrow>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().deleteRow().run()}
          aria-label="Remove row"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
      <Tooltip title="Delete table" arrow>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().deleteTable().run()}
          aria-label="Delete table"
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );

  const addColumnButton = (
    <IconButton
      size="small"
      onClick={() => editor.chain().focus().addColumnAfter().run()}
      aria-label="Add column at end"
      sx={{
        position: "absolute",
        top: position.top,
        left: position.left + position.width + 4,
        width: 24,
        height: position.height,
        borderRadius: "0 4px 4px 0",
        bgcolor: "#f0f0f0",
        "&:hover": { bgcolor: "#e0e0e0" },
        zIndex: 1200,
      }}
    >
      <AddIcon sx={{ fontSize: 16 }} />
    </IconButton>
  );

  const addRowButton = (
    <IconButton
      size="small"
      onClick={() => editor.chain().focus().addRowAfter().run()}
      aria-label="Add row at end"
      sx={{
        position: "absolute",
        top: position.top + position.height + 4,
        left: position.left,
        width: position.width,
        height: 24,
        borderRadius: "0 0 4px 4px",
        bgcolor: "#f0f0f0",
        "&:hover": { bgcolor: "#e0e0e0" },
        zIndex: 1200,
      }}
    >
      <AddIcon sx={{ fontSize: 16 }} />
    </IconButton>
  );

  return createPortal(
    <>
      {menuBar}
      {addColumnButton}
      {addRowButton}
    </>,
    document.body
  );
}
