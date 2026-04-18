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

export function TableMenu({ editor }: TableMenuProps) {
  if (!editor.isActive("table")) {
    return null;
  }

  const actions = [
    {
      label: "Add column after",
      icon: <AddIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />,
      action: () => editor.chain().focus().addColumnAfter().run(),
      shortLabel: "Col+",
    },
    {
      label: "Remove column",
      icon: <RemoveIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />,
      action: () => editor.chain().focus().deleteColumn().run(),
      shortLabel: "Col-",
    },
    {
      label: "Add row after",
      icon: <AddIcon fontSize="small" />,
      action: () => editor.chain().focus().addRowAfter().run(),
      shortLabel: "Row+",
    },
    {
      label: "Remove row",
      icon: <RemoveIcon fontSize="small" />,
      action: () => editor.chain().focus().deleteRow().run(),
      shortLabel: "Row-",
    },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        px: 0.5,
        py: 0.25,
        mb: 1,
        borderRadius: 1,
        width: "fit-content",
      }}
    >
      {actions.map((btn) => (
        <Tooltip key={btn.label} title={btn.label} arrow>
          <IconButton size="small" onClick={btn.action} aria-label={btn.label}>
            {btn.icon}
          </IconButton>
        </Tooltip>
      ))}
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
}
