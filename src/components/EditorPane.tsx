import Box from "@mui/material/Box";
import { useEditorStore } from "@/hooks/useEditorStore";

export function EditorPane() {
  const markdown = useEditorStore((s) => s.markdown);
  const updateMarkdown = useEditorStore((s) => s.updateMarkdown);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        component="textarea"
        value={markdown}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateMarkdown(e.target.value)}
        spellCheck={false}
        sx={{
          flex: 1,
          resize: "none",
          border: "none",
          outline: "none",
          p: 2,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: "14px",
          lineHeight: 1.6,
          backgroundColor: "#fafafa",
          color: "#333",
        }}
      />
    </Box>
  );
}
