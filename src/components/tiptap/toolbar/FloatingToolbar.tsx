import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import CodeIcon from "@mui/icons-material/Code";

interface FloatingToolbarProps {
  editor: Editor;
}

interface ToolbarButton {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  isActive: boolean;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const formatButtons: ToolbarButton[] = [
    {
      label: "Bold",
      icon: <FormatBoldIcon fontSize="small" />,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: <FormatItalicIcon fontSize="small" />,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "Strikethrough",
      icon: <StrikethroughSIcon fontSize="small" />,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    {
      label: "Code",
      icon: <CodeIcon fontSize="small" />,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
    },
  ];

  const headingButtons: ToolbarButton[] = [1, 2, 3].map((level) => ({
    label: `Heading ${level}`,
    icon: <span style={{ fontSize: 12, fontWeight: 700 }}>H{level}</span>,
    action: () =>
      editor
        .chain()
        .focus()
        .toggleHeading({ level: level as 1 | 2 | 3 })
        .run(),
    isActive: editor.isActive("heading", { level }),
  }));

  return (
    <BubbleMenu editor={editor}>
      <Paper
        elevation={4}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
        }}
      >
        {formatButtons.map((btn) => (
          <IconButton
            key={btn.label}
            aria-label={btn.label}
            size="small"
            onClick={btn.action}
            color={btn.isActive ? "primary" : "default"}
          >
            {btn.icon}
          </IconButton>
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
        {headingButtons.map((btn) => (
          <IconButton
            key={btn.label}
            aria-label={btn.label}
            size="small"
            onClick={btn.action}
            color={btn.isActive ? "primary" : "default"}
            sx={{ width: 28, height: 28 }}
          >
            {btn.icon}
          </IconButton>
        ))}
      </Paper>
    </BubbleMenu>
  );
}
