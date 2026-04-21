import { useState, useCallback, type ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useEditorInstance } from "@/hooks/useEditorInstance";
import { useEditorStore, EMPTY_CONTENT } from "@/hooks/useEditorStore";

interface LayoutProps {
  children: ReactNode;
}

type FeedbackSeverity = "success" | "error" | "info";
type Feedback = { message: string; severity: FeedbackSeverity } | null;

export function Layout({ children }: LayoutProps) {
  const editor = useEditorInstance((s) => s.editor);
  const reset = useEditorStore((s) => s.reset);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getMarkdown = useCallback((): string | null => {
    if (!editor) return null;
    const storage = editor.storage as { markdown?: { getMarkdown: () => string } };
    return storage.markdown?.getMarkdown() ?? null;
  }, [editor]);

  const handleExport = useCallback(() => {
    const markdown = getMarkdown();
    if (markdown === null) {
      setFeedback({ message: "エディタが初期化されていません", severity: "error" });
      return;
    }
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ message: "Markdown をダウンロードしました", severity: "success" });
  }, [getMarkdown]);

  const handleCopy = useCallback(async () => {
    const markdown = getMarkdown();
    if (markdown === null) {
      setFeedback({ message: "エディタが初期化されていません", severity: "error" });
      return;
    }
    try {
      await navigator.clipboard.writeText(markdown);
      setFeedback({ message: "クリップボードにコピーしました", severity: "success" });
    } catch {
      setFeedback({ message: "コピーに失敗しました", severity: "error" });
    }
  }, [getMarkdown]);

  const handleClearConfirm = useCallback(() => {
    if (editor) {
      editor.commands.setContent(EMPTY_CONTENT);
    }
    reset();
    setConfirmOpen(false);
    setFeedback({ message: "新規状態にしました", severity: "info" });
  }, [editor, reset]);

  const hasEditor = Boolean(editor);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          flexShrink: 0,
          zIndex: 1400,
          bgcolor: "#ffffff",
          color: "#333",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Toolbar
          variant="dense"
          sx={{ gap: 1, minHeight: 36, "@media (min-width: 600px)": { minHeight: 36 } }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Markdown Editor"
            sx={{ height: 24, width: 24, flexGrow: 0, display: "block" }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Markdown をコピー">
            <span>
              <IconButton
                color="inherit"
                size="small"
                onClick={handleCopy}
                disabled={!hasEditor}
                aria-label="copy markdown"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Markdown をダウンロード">
            <span>
              <IconButton
                color="inherit"
                size="small"
                onClick={handleExport}
                disabled={!hasEditor}
                aria-label="export markdown"
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="新規作成（編集中の内容はクリアされます）">
            <span>
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setConfirmOpen(true)}
                disabled={!hasEditor}
                aria-label="clear editor"
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, overflow: "hidden" }}>
        {children}
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>新規作成</DialogTitle>
        <DialogContent>
          <DialogContentText>
            編集中の内容を破棄して新規状態にします。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button onClick={handleClearConfirm} color="error" variant="contained">
            クリア
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {feedback ? (
          <Alert
            onClose={() => setFeedback(null)}
            severity={feedback.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

function buildFilename(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `markdown-${stamp}.md`;
}
