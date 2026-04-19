import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface TableMenuProps {
  editor: Editor;
}

function getEditorDom(editor: Editor): HTMLElement | null {
  try {
    return editor.view.dom;
  } catch {
    return null;
  }
}

function getActiveTableEl(editor: Editor): HTMLTableElement | null {
  try {
    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "table") {
        const domNode = editor.view.nodeDOM(
          $from.before(depth)
        ) as HTMLElement | null;
        return domNode?.querySelector("table") ?? (domNode as HTMLTableElement | null);
      }
    }
  } catch {
    // view not available
  }
  return null;
}

interface TablePosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface HoveredRow {
  index: number;
  top: number;
  height: number;
}

interface HoveredColumn {
  index: number;
  left: number;
  width: number;
}

function useTablePosition(
  editor: Editor,
  hoveredTableRef: React.RefObject<HTMLTableElement | null>,
  hoveredRow: HoveredRow | null,
  hoveredColumn: HoveredColumn | null
): TablePosition | null {
  const [position, setPosition] = useState<TablePosition | null>(null);

  const updatePosition = useCallback(() => {
    const tableEl = hoveredTableRef.current;
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
  }, [hoveredTableRef]);

  // ホバー行/列が変わったら位置を再計算
  useEffect(() => {
    updatePosition();
  }, [hoveredRow, hoveredColumn, updatePosition]);

  // エディタの内容変更時も再計算（列追加等でサイズ変わる）
  useEffect(() => {
    let rafId1 = 0;
    let rafId2 = 0;
    const handler = () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(updatePosition);
      });
    };
    const handleScroll = () => {
      setPosition(null);
    };
    editor.on("update", handler);
    editor.on("transaction", handler);

    const findScrollParent = (): HTMLElement | null => {
      const dom = getEditorDom(editor);
      let el = dom?.parentElement ?? null;
      while (el) {
        const style = getComputedStyle(el);
        if (style.overflow === "auto" || style.overflowY === "auto" ||
            style.overflow === "scroll" || style.overflowY === "scroll") {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    let scrollEl = findScrollParent();
    scrollEl?.addEventListener("scroll", handleScroll);

    const attachScroll = () => {
      scrollEl = findScrollParent();
      scrollEl?.addEventListener("scroll", handleScroll);
    };
    editor.on("create", attachScroll);

    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      editor.off("update", handler);
      editor.off("transaction", handler);
      editor.off("create", attachScroll);
      scrollEl?.removeEventListener("scroll", handleScroll);
    };
  }, [editor, updatePosition]);

  return position;
}

function useTableHover(editor: Editor) {
  const [hoveredRow, setHoveredRow] = useState<HoveredRow | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<HoveredColumn | null>(
    null
  );
  const tableRef = useRef<HTMLTableElement | null>(null);
  const gripHoveredRef = useRef(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const clearHover = useCallback(() => {
    if (gripHoveredRef.current) return;
    setHoveredRow(null);
    setHoveredColumn(null);
  }, []);

  const scheduleClearHover = useCallback(() => {
    if (gripHoveredRef.current) return;
    cancelLeaveTimer();
    leaveTimerRef.current = setTimeout(clearHover, 300);
  }, [cancelLeaveTimer, clearHover]);

  const onGripEnter = useCallback(() => {
    gripHoveredRef.current = true;
    cancelLeaveTimer();
  }, [cancelLeaveTimer]);

  const onGripLeave = useCallback(() => {
    gripHoveredRef.current = false;
    scheduleClearHover();
  }, [scheduleClearHover]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gripHoveredRef.current) return;
      cancelLeaveTimer();

      const target = e.target as HTMLElement;
      const cell = target.closest("td, th");
      const tableEl = cell?.closest("table") ?? null;
      if (!tableEl) {
        scheduleClearHover();
        tableRef.current = null;
        return;
      }
      tableRef.current = tableEl;

      if (!cell) {
        scheduleClearHover();
        return;
      }

      const row = cell.closest("tr");
      if (row) {
        const rowRect = row.getBoundingClientRect();
        const rows = Array.from(tableEl.querySelectorAll("tr"));
        const rowIndex = rows.indexOf(row);
        setHoveredRow({
          index: rowIndex,
          top: rowRect.top + window.scrollY,
          height: rowRect.height,
        });
      }

      const cellEl = cell as HTMLTableCellElement;
      const cellRect = cellEl.getBoundingClientRect();
      setHoveredColumn({
        index: cellEl.cellIndex,
        left: cellRect.left + window.scrollX,
        width: cellRect.width,
      });
    };

    const handleMouseLeave = () => {
      if (gripHoveredRef.current) return;
      scheduleClearHover();
    };

    let currentDom: HTMLElement | null = null;

    const attach = () => {
      const dom = getEditorDom(editor);
      if (!dom || dom === currentDom) return;
      if (currentDom) {
        currentDom.removeEventListener("mousemove", handleMouseMove);
        currentDom.removeEventListener("mouseleave", handleMouseLeave);
      }
      currentDom = dom;
      dom.addEventListener("mousemove", handleMouseMove);
      dom.addEventListener("mouseleave", handleMouseLeave);
    };

    attach();
    editor.on("create", attach);

    return () => {
      editor.off("create", attach);
      cancelLeaveTimer();
      if (currentDom) {
        currentDom.removeEventListener("mousemove", handleMouseMove);
        currentDom.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [editor, cancelLeaveTimer, clearHover, scheduleClearHover]);

  return {
    hoveredRow,
    hoveredColumn,
    setHoveredRow,
    setHoveredColumn,
    onGripEnter,
    onGripLeave,
    tableRef,
  };
}

function focusCellAt(editor: Editor, rowIndex: number, colIndex: number) {
  const tableEl = getActiveTableEl(editor);
  if (!tableEl) return;
  const rows = tableEl.querySelectorAll("tr");
  const targetRow = rows[rowIndex];
  if (!targetRow) return;
  const cells = targetRow.querySelectorAll("td, th");
  const targetCell = cells[colIndex];
  if (!targetCell) return;
  try {
    const pos = editor.view.posAtDOM(targetCell, 0);
    editor.chain().focus().setTextSelection(pos).run();
  } catch {
    // view not available
  }
}

export function TableMenu({ editor }: TableMenuProps) {
  const {
    hoveredRow,
    hoveredColumn,
    setHoveredRow,
    setHoveredColumn,
    onGripEnter,
    onGripLeave,
    tableRef,
  } = useTableHover(editor);
  const position = useTablePosition(editor, tableRef, hoveredRow, hoveredColumn);

  const [rowMenuPos, setRowMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [colMenuPos, setColMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(-1);
  const [activeColIndex, setActiveColIndex] = useState<number>(-1);

  const handleRowGripClick = (
    e: React.MouseEvent<HTMLElement>,
    rowIndex: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenuPos({ top: rect.bottom, left: rect.left });
    setActiveRowIndex(rowIndex);
  };

  const handleColGripClick = (
    e: React.MouseEvent<HTMLElement>,
    colIndex: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setColMenuPos({ top: rect.bottom, left: rect.left });
    setActiveColIndex(colIndex);
  };

  const closeRowMenu = () => {
    setRowMenuPos(null);
    setActiveRowIndex(-1);
    setHoveredRow(null);
    setHoveredColumn(null);
    onGripLeave();
  };

  const closeColMenu = () => {
    setColMenuPos(null);
    setActiveColIndex(-1);
    setHoveredRow(null);
    setHoveredColumn(null);
    onGripLeave();
  };

  const handleRowAction = (action: "addAbove" | "addBelow" | "delete") => {
    focusCellAt(editor, activeRowIndex, 0);
    switch (action) {
      case "addAbove":
        editor.chain().focus().addRowBefore().run();
        break;
      case "addBelow":
        editor.chain().focus().addRowAfter().run();
        break;
      case "delete":
        editor.chain().focus().deleteRow().run();
        break;
    }
    closeRowMenu();
  };

  const handleColAction = (action: "addLeft" | "addRight" | "delete") => {
    focusCellAt(editor, 0, activeColIndex);
    switch (action) {
      case "addLeft":
        editor.chain().focus().addColumnBefore().run();
        break;
      case "addRight":
        editor.chain().focus().addColumnAfter().run();
        break;
      case "delete":
        editor.chain().focus().deleteColumn().run();
        break;
    }
    closeColMenu();
  };

  if (!position) {
    return null;
  }

  const isHeaderRow = hoveredRow?.index === 0;

  const gripButtonStyles = {
    minWidth: 0,
    padding: "1px 2px",
    borderRadius: "3px",
    bgcolor: "rgba(55, 53, 47, 0.06)",
    color: "rgba(55, 53, 47, 0.35)",
    "&:hover": { bgcolor: "rgba(55, 53, 47, 0.1)", color: "rgba(55, 53, 47, 0.6)" },
    zIndex: 1200,
    cursor: "pointer",
  } as const;

  const rowGrip =
    hoveredRow && !rowMenuPos ? (
      <IconButton
        data-table-grip="row"
        size="small"
        onClick={(e) => handleRowGripClick(e, hoveredRow.index)}
        onMouseEnter={onGripEnter}
        onMouseLeave={onGripLeave}
        aria-label="Row options"
        sx={{
          position: "absolute",
          top: hoveredRow.top,
          left: position.left - 22,
          width: 20,
          height: hoveredRow.height,
          borderRadius: "3px 0 0 3px",
          ...gripButtonStyles,
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 14 }} />
      </IconButton>
    ) : null;

  const colGrip =
    hoveredColumn && !colMenuPos ? (
      <IconButton
        data-table-grip="column"
        size="small"
        onClick={(e) => handleColGripClick(e, hoveredColumn.index)}
        onMouseEnter={onGripEnter}
        onMouseLeave={onGripLeave}
        aria-label="Column options"
        sx={{
          position: "absolute",
          top: position.top - 20,
          left: hoveredColumn.left,
          width: hoveredColumn.width,
          height: 18,
          borderRadius: "3px 3px 0 0",
          ...gripButtonStyles,
        }}
      >
        <DragIndicatorIcon
          sx={{ fontSize: 14, transform: "rotate(90deg)" }}
        />
      </IconButton>
    ) : null;

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
      {rowGrip}
      {colGrip}
      {addColumnButton}
      {addRowButton}

      <Menu
        open={Boolean(rowMenuPos)}
        onClose={closeRowMenu}
        anchorReference="anchorPosition"
        anchorPosition={rowMenuPos ?? undefined}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem onClick={() => handleRowAction("addAbove")}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>上に行を追加</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleRowAction("addBelow")}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>下に行を追加</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleRowAction("delete")}
          disabled={isHeaderRow}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: isHeaderRow ? undefined : "error.main" }}>
            行を削除
          </ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        open={Boolean(colMenuPos)}
        onClose={closeColMenu}
        anchorReference="anchorPosition"
        anchorPosition={colMenuPos ?? undefined}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem onClick={() => handleColAction("addLeft")}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>左に列を追加</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleColAction("addRight")}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>右に列を追加</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleColAction("delete")}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>列を削除</ListItemText>
        </MenuItem>
      </Menu>
    </>,
    document.body
  );
}
