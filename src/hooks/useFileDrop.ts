import { useState, useCallback, useEffect, useRef } from "react";

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd", ".mkdn"];

function isMarkdownFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") {
        resolve(text);
      } else {
        reject(new Error("ファイルの読み込みに失敗しました。"));
      }
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました。"));
    reader.readAsText(file);
  });
}

export interface DroppedFile {
  name: string;
  markdown: string;
}

interface UseFileDropOptions {
  onDropMarkdown: (files: DroppedFile[]) => void;
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

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const fileList = e.dataTransfer?.files;
      if (!fileList || fileList.length === 0) return;

      const incoming = Array.from(fileList);
      const markdownFiles = incoming.filter(isMarkdownFile);
      const skipped = incoming.filter((f) => !isMarkdownFile(f));

      if (markdownFiles.length === 0) {
        setError(
          "マークダウンファイルが見つかりません。.md または .markdown ファイルをドロップしてください。"
        );
        return;
      }

      try {
        const results = await Promise.all(
          markdownFiles.map(async (file) => ({
            name: file.name,
            markdown: await readAsText(file),
          }))
        );
        onDropMarkdown(results);

        if (skipped.length > 0) {
          const names = skipped.map((f) => `「${f.name}」`).join(", ");
          setError(`${names} はマークダウンファイルではないためスキップしました。`);
        }
      } catch {
        setError("ファイルの読み込みに失敗しました。");
      }
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
