import { useState, useRef } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from "@mui/icons-material/History";
import { useOpenFiles, type OpenFile, type Folder } from "@/hooks/useOpenFiles";
import { useRecentFiles, type RecentFile } from "@/hooks/useRecentFiles";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 36;

export function Sidebar() {
  const files = useOpenFiles((s) => s.files);
  const folders = useOpenFiles((s) => s.folders);
  const rootOrder = useOpenFiles((s) => s.rootOrder);
  const activeId = useOpenFiles((s) => s.activeId);
  const setActive = useOpenFiles((s) => s.setActive);
  const closeFile = useOpenFiles((s) => s.closeFile);
  const createUntitled = useOpenFiles((s) => s.createUntitled);
  const renameFolder = useOpenFiles((s) => s.renameFolder);
  const deleteFolder = useOpenFiles((s) => s.deleteFolder);
  const toggleFolder = useOpenFiles((s) => s.toggleFolder);
  const moveFileToFolder = useOpenFiles((s) => s.moveFileToFolder);
  const moveFileToRoot = useOpenFiles((s) => s.moveFileToRoot);
  const openRecent = useOpenFiles((s) => s.openRecent);
  const recents = useRecentFiles((s) => s.recents);
  const removeRecent = useRecentFiles((s) => s.remove);
  const collapsed = useSidebarPrefs((s) => s.collapsed);
  const toggleCollapsed = useSidebarPrefs((s) => s.toggleCollapsed);

  const [pendingCloseId, setPendingCloseId] = useState<string | null>(null);
  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState<string | null>(null);

  const pendingCloseFile = pendingCloseId
    ? files.find((f) => f.id === pendingCloseId)
    : null;
  const pendingDeleteFolder = pendingDeleteFolderId
    ? folders.find((f) => f.id === pendingDeleteFolderId)
    : null;

  const requestClose = (file: OpenFile) => {
    if (file.isDirty) setPendingCloseId(file.id);
    else closeFile(file.id);
  };

  const confirmClose = () => {
    if (pendingCloseId) {
      closeFile(pendingCloseId);
      setPendingCloseId(null);
    }
  };

  const confirmDeleteFolder = () => {
    if (pendingDeleteFolderId) {
      deleteFolder(pendingDeleteFolderId);
      setPendingDeleteFolderId(null);
    }
  };

  const handleRootDrop = (e: React.DragEvent) => {
    const fileId = e.dataTransfer.getData("sidebar-file-id");
    if (!fileId) return;
    const file = files.find((f) => f.id === fileId);
    if (file?.folderId) moveFileToRoot(fileId);
  };

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const fileById = new Map(files.map((f) => [f.id, f]));
  const folderById = new Map(folders.map((f) => [f.id, f]));

  type RootItem = { type: "folder"; folder: Folder } | { type: "file"; file: OpenFile };
  const rootItems: RootItem[] = rootOrder.flatMap<RootItem>((id) => {
    const folder = folderById.get(id);
    if (folder) return [{ type: "folder", folder }];
    const file = fileById.get(id);
    if (file) return [{ type: "file", file }];
    return [];
  });

  const isEmpty = files.length === 0;

  // 開いているファイルは上のツリーに出ているので Recently からは除く
  const openPaths = new Set(files.map((f) => f.path));
  const visibleRecents = recents.filter((r) => !openPaths.has(r.path));

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
        <Box
          data-testid="sidebar-root-drop"
          sx={{ flex: 1, overflowY: "auto" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleRootDrop}
        >
          {isEmpty ? (
            <Box sx={{ px: 1.5, py: 2 }}>
              <Typography variant="caption" sx={{ color: "#999" }}>
                マークダウンファイルをドロップして開始
              </Typography>
            </Box>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {rootItems.map((item) =>
                item.type === "folder" ? (
                  <FolderRow
                    key={item.folder.id}
                    folder={item.folder}
                    files={
                      item.folder.childIds
                        .map((id) => fileById.get(id))
                        .filter(Boolean) as OpenFile[]
                    }
                    activeId={activeId}
                    onActivate={(id) => setActive(id)}
                    onClose={(file) => requestClose(file)}
                    onToggle={toggleFolder}
                    onRename={renameFolder}
                    onDelete={(folderId) => setPendingDeleteFolderId(folderId)}
                    onMoveFileToFolder={moveFileToFolder}
                  />
                ) : (
                  <FileRow
                    key={item.file.id}
                    file={item.file}
                    active={item.file.id === activeId}
                    onActivate={() => setActive(item.file.id)}
                    onClose={() => requestClose(item.file)}
                  />
                )
              )}
            </Box>
          )}

          {visibleRecents.length > 0 && (
            <Box sx={{ borderTop: "1px solid #e0e0e0", mt: 1, pt: 0.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                }}
              >
                <HistoryIcon sx={{ fontSize: 14, color: "#666" }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: "#666",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Recently
                </Typography>
              </Box>
              <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                {visibleRecents.map((recent) => (
                  <RecentRow
                    key={recent.path}
                    recent={recent}
                    onOpen={() => openRecent(recent)}
                    onRemove={() => removeRecent(recent.path)}
                  />
                ))}
              </Box>
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

      <Dialog
        open={pendingDeleteFolder !== null}
        onClose={() => setPendingDeleteFolderId(null)}
      >
        <DialogTitle>フォルダを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingDeleteFolder
              ? `「${pendingDeleteFolder.name}」を削除します。フォルダ内のファイルはルートに移動されます。`
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDeleteFolderId(null)}>キャンセル</Button>
          <Button onClick={confirmDeleteFolder} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

interface FolderRowProps {
  folder: Folder;
  files: OpenFile[];
  activeId: string | null;
  onActivate: (id: string) => void;
  onClose: (file: OpenFile) => void;
  onToggle: (folderId: string) => void;
  onRename: (folderId: string, name: string) => void;
  onDelete: (folderId: string) => void;
  onMoveFileToFolder: (fileId: string, folderId: string) => void;
}

function FolderRow({
  folder,
  files,
  activeId,
  onActivate,
  onClose,
  onToggle,
  onRename,
  onDelete,
  onMoveFileToFolder,
}: FolderRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) {
      onRename(folder.id, trimmed);
    } else {
      setRenameValue(folder.name);
    }
    setIsRenaming(false);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const fileId = e.dataTransfer.getData("sidebar-file-id");
    if (fileId) onMoveFileToFolder(fileId, folder.id);
  };

  return (
    <>
      <Box
        component="li"
        data-testid="folder-drop-zone"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          bgcolor: isDragOver ? "rgba(25, 118, 210, 0.08)" : "transparent",
          transition: "background-color 80ms ease",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.5,
            py: 0.25,
            cursor: "default",
            "&:hover .folder-action-btn": { opacity: 1 },
          }}
        >
          <IconButton
            size="small"
            onClick={() => onToggle(folder.id)}
            aria-label={
              folder.expanded ? `${folder.name} を閉じる` : `${folder.name} を開く`
            }
            sx={{ p: 0.25 }}
          >
            {folder.expanded ? (
              <ExpandMoreIcon sx={{ fontSize: 16, color: "#666" }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 16, color: "#666" }} />
            )}
          </IconButton>
          {folder.expanded ? (
            <FolderOpenIcon sx={{ fontSize: 16, color: "#f9a825", flexShrink: 0 }} />
          ) : (
            <FolderIcon sx={{ fontSize: 16, color: "#f9a825", flexShrink: 0 }} />
          )}
          {isRenaming ? (
            <TextField
              size="small"
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setRenameValue(folder.name);
                  setIsRenaming(false);
                }
              }}
              inputProps={{ "aria-label": "folder name input" }}
              sx={{
                flex: 1,
                "& .MuiInputBase-input": { fontSize: "0.8125rem", py: 0.25, px: 0.5 },
              }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#333",
                fontWeight: 600,
                fontSize: "0.8125rem",
              }}
              title={folder.name}
            >
              {folder.name}
            </Typography>
          )}
          <Tooltip title="リネーム">
            <IconButton
              className="folder-action-btn"
              size="small"
              onClick={() => {
                setRenameValue(folder.name);
                setIsRenaming(true);
              }}
              aria-label={`${folder.name} をリネーム`}
              sx={{ p: 0.25, opacity: 0, transition: "opacity 120ms ease" }}
            >
              <EditIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="削除">
            <IconButton
              className="folder-action-btn"
              size="small"
              onClick={() => onDelete(folder.id)}
              aria-label={`${folder.name} を削除`}
              sx={{ p: 0.25, opacity: 0, transition: "opacity 120ms ease" }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
        {folder.expanded && (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                active={file.id === activeId}
                onActivate={() => onActivate(file.id)}
                onClose={() => onClose(file)}
                indent
              />
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}

interface FileRowProps {
  file: OpenFile;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
  indent?: boolean;
}

function FileRow({ file, active, onActivate, onClose, indent = false }: FileRowProps) {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("sidebar-file-id", file.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Box
      component="li"
      role="button"
      tabIndex={0}
      aria-selected={active}
      draggable
      onDragStart={handleDragStart}
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
        pl: indent ? 3.5 : 1,
        pr: 1,
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

interface RecentRowProps {
  recent: RecentFile;
  onOpen: () => void;
  onRemove: () => void;
}

function RecentRow({ recent, onOpen, onRemove }: RecentRowProps) {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <Box
      component="li"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        pl: 1,
        pr: 1,
        py: 0.5,
        cursor: "pointer",
        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
        "&:hover .recent-remove-btn": { opacity: 1 },
      }}
    >
      <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, color: "#999", flexShrink: 0 }} />
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "#666",
          fontSize: "0.8125rem",
        }}
        title={recent.path}
      >
        {recent.name}
      </Typography>
      <IconButton
        className="recent-remove-btn"
        size="small"
        onClick={handleRemoveClick}
        aria-label={`remove ${recent.name} from recent`}
        sx={{ p: 0.25, opacity: 0, transition: "opacity 120ms ease" }}
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}
