import { useState, useCallback, useEffect, useRef } from "react";

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd", ".mkdn"];

function isMarkdownFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => name.endsWith(ext));
}

interface UseFileDropOptions {
  onDropMarkdown: (content: string) => void;
  targetRef: React.RefObject<HTMLElement | null>;
}

interface UseFileDropResult {
  isDragging: boolean;
  error: string | null;
  clearError: () => void;
}

export function useFileDrop({
  onDropMarkdown,
  targetRef,
}: UseFileDropOptions): UseFileDropResult {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDragging(true);
        setError(null);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      if (files.length > 1) {
        setError(
          "複数ファイルのドロップには対応していません。1つのファイルをドロップしてください。"
        );
        return;
      }

      const file = files[0];
      if (!isMarkdownFile(file)) {
        setError(
          `「${file.name}」はマークダウンファイルではありません。.md または .markdown ファイルをドロップしてください。`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === "string") {
          onDropMarkdown(text);
        }
      };
      reader.onerror = () => {
        setError("ファイルの読み込みに失敗しました。");
      };
      reader.readAsText(file);
    };

    el.addEventListener("dragenter", handleDragEnter);
    el.addEventListener("dragleave", handleDragLeave);
    el.addEventListener("dragover", handleDragOver);
    el.addEventListener("drop", handleDrop);

    return () => {
      el.removeEventListener("dragenter", handleDragEnter);
      el.removeEventListener("dragleave", handleDragLeave);
      el.removeEventListener("dragover", handleDragOver);
      el.removeEventListener("drop", handleDrop);
    };
  }, [targetRef, onDropMarkdown]);

  return { isDragging, error, clearError };
}
