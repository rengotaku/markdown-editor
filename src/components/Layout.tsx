import { useState, useCallback, useRef, type ReactNode } from "react";
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
import Switch from "@mui/material/Switch";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useOpenFiles, type IncomingFile } from "@/hooks/useOpenFiles";
import { useEditorPrefs } from "@/hooks/useEditorPrefs";
import { useFileDrop, type DroppedFile } from "@/hooks/useFileDrop";
import { simpleHash, buildFixFilename } from "@/utils/hash";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

type FeedbackSeverity = "success" | "error" | "info";
type Feedback = { message: string; severity: FeedbackSeverity } | null;

export function Layout({ children }: LayoutProps) {
  const files = useOpenFiles((s) => s.files);
  const activeId = useOpenFiles((s) => s.activeId);
  const closeAll = useOpenFiles((s) => s.closeAll);
  const addFiles = useOpenFiles((s) => s.addFiles);
  const overwriteFiles = useOpenFiles((s) => s.overwriteFiles);
  const centered = useEditorPrefs((s) => s.centered);
  const toggleCentered = useEditorPrefs((s) => s.toggleCentered);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<IncomingFile[]>([]);
  const dropTargetRef = useRef<HTMLDivElement>(null);

  const activeFile = activeId ? files.find((f) => f.id === activeId) : undefined;
  const hasActiveFile = Boolean(activeFile);

  const handleExport = useCallback(() => {
    if (!activeFile) {
      setFeedback({ message: "アクティブなファイルがありません", severity: "error" });
      return;
    }
    const blob = new Blob([activeFile.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const isModified = simpleHash(activeFile.markdown) !== activeFile.initialHash;
    const baseName = activeFile.name || buildFilename();
    a.download = isModified ? buildFixFilename(baseName) : baseName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ message: "Markdown をダウンロードしました", severity: "success" });
  }, [activeFile]);

  const handleCopy = useCallback(async () => {
    if (!activeFile) {
      setFeedback({ message: "アクティブなファイルがありません", severity: "error" });
      return;
    }
    try {
      await navigator.clipboard.writeText(activeFile.markdown);
      setFeedback({ message: "クリップボードにコピーしました", severity: "success" });
    } catch {
      setFeedback({ message: "コピーに失敗しました", severity: "error" });
    }
  }, [activeFile]);

  const handleClearConfirm = useCallback(() => {
    closeAll();
    setConfirmOpen(false);
    setFeedback({ message: "すべてのファイルを閉じました", severity: "info" });
  }, [closeAll]);

  const handleDropMarkdown = useCallback(
    (dropped: DroppedFile[]) => {
      const existingFiles = useOpenFiles.getState().files;
      const seenPaths = new Set<string>();
      const samePathConflicts: IncomingFile[] = [];
      const fresh: IncomingFile[] = [];
      const diffPathSameNames: string[] = [];

      for (const file of dropped) {
        const filePath = file.path;
        const samePathExisting = existingFiles.find(
          (f) => f.name === file.name && (f.path ?? f.name) === filePath
        );

        if (samePathExisting || seenPaths.has(filePath)) {
          samePathConflicts.push(file);
        } else {
          const diffPathExists = existingFiles.some(
            (f) => f.name === file.name && (f.path ?? f.name) !== filePath
          );
          fresh.push(file);
          seenPaths.add(filePath);
          if (diffPathExists) {
            diffPathSameNames.push(file.name);
          }
        }
      }

      if (fresh.length > 0) addFiles(fresh);
      if (samePathConflicts.length > 0) {
        setPendingConflicts((prev) => mergeByPath(prev, samePathConflicts));
      }
      if (diffPathSameNames.length > 0) {
        setFeedback({
          message: "同名のファイルが他の場所にも存在します",
          severity: "info",
        });
      }
    },
    [addFiles]
  );

  const handleDropError = useCallback(
    (message: string) => setFeedback({ message, severity: "error" }),
    []
  );

  const { isDragging } = useFileDrop({
    onDropMarkdown: handleDropMarkdown,
    onError: handleDropError,
    targetRef: dropTargetRef,
  });

  const confirmOverwrite = () => {
    overwriteFiles(pendingConflicts);
    setPendingConflicts([]);
  };

  const cancelOverwrite = () => {
    setPendingConflicts([]);
  };

  const generateAutoName = (baseName: string, existingNames: Set<string>): string => {
    const dotIdx = baseName.lastIndexOf(".");
    const base = dotIdx >= 0 ? baseName.slice(0, dotIdx) : baseName;
    const ext = dotIdx >= 0 ? baseName.slice(dotIdx) : "";
    const cleanBase = base.replace(/_v\d+$/, "");
    let version = 2;
    while (existingNames.has(`${cleanBase}_v${version}${ext}`)) {
      version++;
    }
    return `${cleanBase}_v${version}${ext}`;
  };

  const handleRenameClick = () => {
    const existingNames = new Set(useOpenFiles.getState().files.map((f) => f.name));
    const usedNames = new Set(existingNames);
    const renamedFiles: IncomingFile[] = pendingConflicts.map((c) => {
      const newName = generateAutoName(c.name, usedNames);
      usedNames.add(newName);
      return { name: newName, path: newName, markdown: c.markdown };
    });
    addFiles(renamedFiles);
    setPendingConflicts([]);
  };

  const hasFiles = files.length > 0;

  return (
    <Box
      ref={dropTargetRef}
      sx={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
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
          sx={{
            gap: 0.5,
            minHeight: 27,
            px: 1,
            "@media (min-width: 600px)": { minHeight: 27 },
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Markdown Editor"
            sx={{ height: 20, width: 20, flexGrow: 0, display: "block" }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={centered ? "全幅表示に切り替え" : "中央寄せに切り替え"}>
            <Switch
              checked={centered}
              onChange={toggleCentered}
              size="small"
              sx={{ mx: 0.5 }}
              inputProps={{ "aria-label": "toggle centered layout" }}
            />
          </Tooltip>
          <Tooltip title="Markdown をコピー">
            <span>
              <IconButton
                color="inherit"
                size="small"
                onClick={handleCopy}
                disabled={!hasActiveFile}
                aria-label="copy markdown"
                sx={{ p: 0.25 }}
              >
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Markdown をダウンロード">
            <span>
              <IconButton
                color="inherit"
                size="small"
                onClick={handleExport}
                disabled={!hasActiveFile}
                aria-label="export markdown"
                sx={{ p: 0.25 }}
              >
                <DownloadIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="すべてのファイルを閉じる">
            <span>
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setConfirmOpen(true)}
                disabled={!hasFiles}
                aria-label="close all files"
                sx={{ p: 0.25 }}
              >
                <RestartAltIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Sidebar />
        <Box component="main" sx={{ flex: 1, overflow: "hidden" }}>
          {children}
        </Box>

        {isDragging && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(25, 118, 210, 0.08)",
              border: "2px dashed",
              borderColor: "primary.main",
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
      </Box>

      {/* Close all confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>すべて閉じる</DialogTitle>
        <DialogContent>
          <DialogContentText>
            開いているすべてのファイルを閉じます。編集内容は破棄されます。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button onClick={handleClearConfirm} color="error" variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* Same-path conflict: overwrite confirmation dialog */}
      <Dialog open={pendingConflicts.length > 0} onClose={cancelOverwrite}>
        <DialogTitle>同名ファイルが存在します</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            以下のファイルはすでに開いています。
            <Box
              component="ul"
              sx={{
                mt: 1,
                mb: 0,
                pl: 2,
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {pendingConflicts.map((c) => (
                <li key={c.name}>{c.name}</li>
              ))}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelOverwrite}>キャンセル</Button>
          <Button onClick={handleRenameClick}>別名をつける</Button>
          <Button onClick={confirmOverwrite} color="primary" variant="contained">
            上書きする
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

function mergeByPath(prev: IncomingFile[], next: IncomingFile[]): IncomingFile[] {
  const map = new Map<string, IncomingFile>();
  for (const item of prev) map.set(item.path ?? item.name, item);
  for (const item of next) map.set(item.path ?? item.name, item);
  return Array.from(map.values());
}

function buildFilename(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `markdown-${stamp}.md`;
}
