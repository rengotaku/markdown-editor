import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { useOpenFiles } from "@/hooks/useOpenFiles";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";
import { useEditorPrefs } from "@/hooks/useEditorPrefs";
import { useEditorInstance } from "@/hooks/useEditorInstance";

if (import.meta.env.DEV) {
  (window as unknown as { __stores: unknown }).__stores = {
    openFiles: useOpenFiles,
    sidebarPrefs: useSidebarPrefs,
    editorPrefs: useEditorPrefs,
    editorInstance: useEditorInstance,
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
