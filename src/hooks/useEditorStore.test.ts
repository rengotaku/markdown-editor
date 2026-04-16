import { describe, it, expect } from "vitest";
import { useEditorStore } from "./useEditorStore";

describe("useEditorStore", () => {
  it("has default markdown content", () => {
    const state = useEditorStore.getState();
    expect(state.markdown).toContain("# Welcome to Markdown Editor");
  });

  it("updates markdown via updateMarkdown", () => {
    const { updateMarkdown } = useEditorStore.getState();
    updateMarkdown("## Updated");
    expect(useEditorStore.getState().markdown).toBe("## Updated");
  });
});
