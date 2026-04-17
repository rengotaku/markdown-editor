import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./useEditorStore";

describe("useEditorStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(useEditorStore.getInitialState());
  });

  it("has default JSON content with doc type", () => {
    const state = useEditorStore.getState();
    expect(state.content.type).toBe("doc");
    expect(Array.isArray(state.content.content)).toBe(true);
  });

  it("has a welcome heading in default content", () => {
    const state = useEditorStore.getState();
    const firstBlock = state.content.content?.[0];
    expect(firstBlock?.type).toBe("heading");
    expect(firstBlock?.content?.[0]?.text).toBe(
      "Welcome to Markdown Editor"
    );
  });

  it("updates content immutably via updateContent", () => {
    const original = useEditorStore.getState().content;
    const newContent = { type: "doc" as const, content: [] };

    useEditorStore.getState().updateContent(newContent);

    const updated = useEditorStore.getState().content;
    expect(updated).toEqual(newContent);
    expect(updated).not.toBe(original);
  });
});
