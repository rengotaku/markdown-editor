import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AddIcon from "@mui/icons-material/Add";
import { useOpenFiles, type OpenFile } from "@/hooks/useOpenFiles";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 36;

export function Sidebar() {
  const files = useOpenFiles((s) => s.files);
  const activeId = useOpenFiles((s) => s.activeId);
  const setActive = useOpenFiles((s) => s.setActive);
  const closeFile = useOpenFiles((s) => s.closeFile);
  const createUntitled = useOpenFiles((s) => s.createUntitled);
  const collapsed = useSidebarPrefs((s) => s.collapsed);
  const toggleCollapsed = useSidebarPrefs((s) => s.toggleCollapsed);

  const [pendingCloseId, setPendingCloseId] = useState<string | null>(null);

  const pendingCloseFile = pendingCloseId
    ? files.find((f) => f.id === pendingCloseId)
    : null;

  const requestClose = (file: OpenFile) => {
    if (file.isDirty) {
      setPendingCloseId(file.id);
    } else {
      closeFile(file.id);
    }
  };

  const confirmClose = () => {
    if (pendingCloseId) {
      closeFile(pendingCloseId);
      setPendingCloseId(null);
    }
  };

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box
      component="aside"
      sx={{
        width,
        flexShrink: 0,
        borderRight: "1px solid #e0e0e0",
        bgcolor: "#fafafa",
        display: "flex",
        flexDirection: "column",
        transition: "width 150ms ease",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 0 : 1,
          py: 0.5,
          borderBottom: "1px solid #e0e0e0",
          minHeight: 28,
        }}
      >
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              color: "#666",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              ml: 0.5,
            }}
          >
            開いているファイル
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          {!collapsed && (
            <Tooltip title="新規ファイル">
              <IconButton
                size="small"
                onClick={createUntitled}
                aria-label="new untitled file"
                sx={{ p: 0.25 }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"}>
            <IconButton
              size="small"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "expand sidebar" : "collapse sidebar"}
              sx={{ p: 0.25 }}
            >
              {collapsed ? (
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              ) : (
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {!collapsed && (
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {files.length === 0 ? (
            <Box sx={{ px: 1.5, py: 2 }}>
              <Typography variant="caption" sx={{ color: "#999" }}>
                マークダウンファイルをドロップして開始
              </Typography>
            </Box>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  active={file.id === activeId}
                  onActivate={() => setActive(file.id)}
                  onClose={() => requestClose(file)}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      <Dialog open={pendingCloseFile !== null} onClose={() => setPendingCloseId(null)}>
        <DialogTitle>ファイルを閉じる</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingCloseFile
              ? `「${pendingCloseFile.name}」は編集されています。閉じると編集内容は失われます。よろしいですか？`
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingCloseId(null)}>キャンセル</Button>
          <Button onClick={confirmClose} color="error" variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

interface FileRowProps {
  file: OpenFile;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
}

function FileRow({ file, active, onActivate, onClose }: FileRowProps) {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <Box
      component="li"
      role="button"
      tabIndex={0}
      aria-selected={active}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.5,
        cursor: "pointer",
        bgcolor: active ? "rgba(21, 101, 192, 0.12)" : "transparent",
        borderLeft: active ? "2px solid #1565c0" : "2px solid transparent",
        "&:hover": {
          bgcolor: active ? "rgba(21, 101, 192, 0.16)" : "rgba(0, 0, 0, 0.04)",
        },
        "&:hover .file-close-btn": {
          opacity: 1,
        },
      }}
    >
      <InsertDriveFileOutlinedIcon
        sx={{ fontSize: 16, color: active ? "#1565c0" : "#666", flexShrink: 0 }}
      />
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: active ? "#1565c0" : "#333",
          fontWeight: active ? 600 : 400,
          fontSize: "0.8125rem",
        }}
        title={file.name}
      >
        {file.name}
      </Typography>
      {file.isDirty && (
        <Tooltip title="未保存の変更あり">
          <FiberManualRecordIcon sx={{ fontSize: 10, color: "#1565c0", flexShrink: 0 }} />
        </Tooltip>
      )}
      <IconButton
        className="file-close-btn"
        size="small"
        onClick={handleCloseClick}
        aria-label={`close ${file.name}`}
        sx={{
          p: 0.25,
          opacity: active ? 1 : 0,
          transition: "opacity 120ms ease",
        }}
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}
