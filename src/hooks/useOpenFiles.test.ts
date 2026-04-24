import { describe, it, expect, beforeEach } from "vitest";
import { useOpenFiles } from "./useOpenFiles";

describe("useOpenFiles", () => {
  beforeEach(() => {
    useOpenFiles.setState({ files: [], activeId: null });
  });

  it("starts with no files and no active id", () => {
    const state = useOpenFiles.getState();
    expect(state.files).toEqual([]);
    expect(state.activeId).toBeNull();
  });

  it("adds files and activates the first added when none was active", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(2);
    expect(state.files[0].name).toBe("a.md");
    expect(state.activeId).toBe(state.files[0].id);
  });

  it("keeps existing active id when adding more files", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    const first = useOpenFiles.getState().activeId;
    useOpenFiles.getState().addFiles([{ name: "b.md", markdown: "# B" }]);
    expect(useOpenFiles.getState().activeId).toBe(first);
  });

  it("marks active file dirty on content change", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    useOpenFiles.getState().updateActiveMarkdown("# Changed");
    const active = useOpenFiles
      .getState()
      .files.find((f) => f.id === useOpenFiles.getState().activeId);
    expect(active?.markdown).toBe("# Changed");
    expect(active?.isDirty).toBe(true);
  });

  it("does not mark dirty when content is identical", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    useOpenFiles.getState().updateActiveMarkdown("# A");
    const active = useOpenFiles
      .getState()
      .files.find((f) => f.id === useOpenFiles.getState().activeId);
    expect(active?.isDirty).toBe(false);
  });

  it("switches active file", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    const secondId = useOpenFiles.getState().files[1].id;
    useOpenFiles.getState().setActive(secondId);
    expect(useOpenFiles.getState().activeId).toBe(secondId);
  });

  it("closes active file and activates the neighbor", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
      { name: "c.md", markdown: "# C" },
    ]);
    const [a, b, c] = useOpenFiles.getState().files;
    useOpenFiles.getState().setActive(b.id);
    useOpenFiles.getState().closeFile(b.id);
    const state = useOpenFiles.getState();
    expect(state.files.map((f) => f.id)).toEqual([a.id, c.id]);
    expect(state.activeId).toBe(c.id);
  });

  it("closing a non-active file keeps the active id", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    const [a, b] = useOpenFiles.getState().files;
    useOpenFiles.getState().setActive(a.id);
    useOpenFiles.getState().closeFile(b.id);
    const state = useOpenFiles.getState();
    expect(state.activeId).toBe(a.id);
    expect(state.files).toHaveLength(1);
  });

  it("closes the last file and clears active id", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    const id = useOpenFiles.getState().files[0].id;
    useOpenFiles.getState().closeFile(id);
    const state = useOpenFiles.getState();
    expect(state.files).toEqual([]);
    expect(state.activeId).toBeNull();
  });

  it("overwriteFiles replaces markdown by name, resets dirty, bumps reloadToken", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    useOpenFiles.getState().updateActiveMarkdown("# A edited");
    const before = useOpenFiles.getState().files.find((f) => f.name === "a.md")!;

    useOpenFiles.getState().overwriteFiles([{ name: "a.md", markdown: "# A reloaded" }]);

    const after = useOpenFiles.getState().files.find((f) => f.name === "a.md")!;
    expect(after.markdown).toBe("# A reloaded");
    expect(after.isDirty).toBe(false);
    expect(after.reloadToken).toBe(before.reloadToken + 1);
    const other = useOpenFiles.getState().files.find((f) => f.name === "b.md")!;
    expect(other.markdown).toBe("# B");
    expect(other.reloadToken).toBe(0);
  });

  it("overwriteFiles ignores names not present in the store", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    useOpenFiles.getState().overwriteFiles([{ name: "missing.md", markdown: "# X" }]);
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].markdown).toBe("# A");
  });

  it("closeAll removes all files", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    useOpenFiles.getState().closeAll();
    const state = useOpenFiles.getState();
    expect(state.files).toEqual([]);
    expect(state.activeId).toBeNull();
  });
});
