import { describe, it, expect, beforeEach } from "vitest";
import { useRecentFiles, RECENT_LIMIT } from "./useRecentFiles";

describe("useRecentFiles", () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentFiles.setState({ recents: [] });
  });

  it("records opened files with the newest first", () => {
    useRecentFiles.getState().record([{ name: "a.md", markdown: "# A" }]);
    useRecentFiles.getState().record([{ name: "b.md", markdown: "# B" }]);
    expect(useRecentFiles.getState().recents.map((r) => r.name)).toEqual([
      "b.md",
      "a.md",
    ]);
  });

  it("dedupes by path and refreshes the stored content", () => {
    useRecentFiles.getState().record([{ name: "a.md", path: "a.md", markdown: "# A" }]);
    useRecentFiles.getState().record([{ name: "b.md", markdown: "# B" }]);
    useRecentFiles
      .getState()
      .record([{ name: "a.md", path: "a.md", markdown: "# A edited" }]);
    const recents = useRecentFiles.getState().recents;
    expect(recents).toHaveLength(2);
    expect(recents[0].path).toBe("a.md");
    expect(recents[0].markdown).toBe("# A edited");
  });

  it(`keeps at most ${RECENT_LIMIT} entries`, () => {
    for (let i = 0; i < RECENT_LIMIT + 5; i++) {
      useRecentFiles.getState().record([{ name: `f${i}.md`, markdown: `# ${i}` }]);
    }
    const recents = useRecentFiles.getState().recents;
    expect(recents).toHaveLength(RECENT_LIMIT);
    expect(recents[0].name).toBe(`f${RECENT_LIMIT + 4}.md`);
  });

  it("skips empty files", () => {
    useRecentFiles.getState().record([{ name: "untitled.md", markdown: "" }]);
    expect(useRecentFiles.getState().recents).toEqual([]);
  });

  it("removes a single entry", () => {
    useRecentFiles.getState().record([{ name: "a.md", markdown: "# A" }]);
    useRecentFiles.getState().remove("a.md");
    expect(useRecentFiles.getState().recents).toEqual([]);
  });
});
