import { describe, it, expect, beforeEach } from "vitest";
import { useOpenFiles } from "./useOpenFiles";

describe("useOpenFiles", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], folders: [], rootOrder: [], activeId: null });
  });

  it("starts with no files and no active id when reset", () => {
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

  it("activates the first newly added file when adding more files", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    useOpenFiles.getState().addFiles([{ name: "b.md", markdown: "# B" }]);
    const bId = useOpenFiles.getState().files.find((f) => f.name === "b.md")!.id;
    expect(useOpenFiles.getState().activeId).toBe(bId);
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

  it("auto-creates an untitled file when closing the last open file", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    const id = useOpenFiles.getState().files[0].id;
    useOpenFiles.getState().closeFile(id);
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].name).toBe("untitled.md");
    expect(state.files[0].markdown).toBe("");
    expect(state.activeId).toBe(state.files[0].id);
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

  it("overwriteFiles activates the first overwritten file when it was not active", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    const [a, b] = useOpenFiles.getState().files;
    useOpenFiles.getState().setActive(a.id);

    useOpenFiles.getState().overwriteFiles([{ name: "b.md", markdown: "# B reloaded" }]);

    expect(useOpenFiles.getState().activeId).toBe(b.id);
  });

  it("overwriteFiles keeps the active id when the already-active file is overwritten", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    const [a] = useOpenFiles.getState().files;
    useOpenFiles.getState().setActive(a.id);

    useOpenFiles.getState().overwriteFiles([{ name: "a.md", markdown: "# A reloaded" }]);

    expect(useOpenFiles.getState().activeId).toBe(a.id);
  });

  it("overwriteFiles ignores names not present in the store", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    useOpenFiles.getState().overwriteFiles([{ name: "missing.md", markdown: "# X" }]);
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].markdown).toBe("# A");
  });

  it("closeAll replaces all files with a fresh untitled file", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    useOpenFiles.getState().closeAll();
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].name).toBe("untitled.md");
    expect(state.activeId).toBe(state.files[0].id);
  });

  it("createUntitled appends untitled.md and activates it", () => {
    useOpenFiles.getState().createUntitled();
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].name).toBe("untitled.md");
    expect(state.activeId).toBe(state.files[0].id);
  });

  it("createUntitled increments the suffix when names collide", () => {
    useOpenFiles.getState().addFiles([
      { name: "untitled.md", markdown: "" },
      { name: "untitled-2.md", markdown: "" },
    ]);
    useOpenFiles.getState().createUntitled();
    const names = useOpenFiles.getState().files.map((f) => f.name);
    expect(names).toEqual(["untitled.md", "untitled-2.md", "untitled-3.md"]);
  });

  it("addFiles appends file ids to rootOrder", () => {
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "b.md", markdown: "# B" },
    ]);
    const state = useOpenFiles.getState();
    expect(state.rootOrder).toEqual(state.files.map((f) => f.id));
  });
});

describe("useOpenFiles - folder management", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], folders: [], rootOrder: [], activeId: null });
  });

  it("addFilesInNewFolder creates a folder with the given name and places files inside", () => {
    useOpenFiles.getState().addFilesInNewFolder(
      [
        { name: "a.md", markdown: "# A" },
        { name: "b.md", markdown: "# B" },
      ],
      "my-folder"
    );
    const state = useOpenFiles.getState();
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].name).toBe("my-folder");
    expect(state.folders[0].childIds).toHaveLength(2);
    expect(state.folders[0].expanded).toBe(true);
    expect(state.files).toHaveLength(2);
    state.files.forEach((f) => expect(f.folderId).toBe(state.folders[0].id));
    expect(state.rootOrder).toEqual([state.folders[0].id]);
    expect(state.activeId).toBe(state.files[0].id);
  });

  it("addFilesInNewFolder appends folder id to rootOrder after existing root items", () => {
    useOpenFiles.getState().addFiles([{ name: "root.md", markdown: "" }]);
    const rootFileId = useOpenFiles.getState().files[0].id;
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "folder1");
    const state = useOpenFiles.getState();
    const folderId = state.folders[0].id;
    expect(state.rootOrder).toEqual([rootFileId, folderId]);
  });

  it("renameFolder changes the folder name", () => {
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "old-name");
    const folderId = useOpenFiles.getState().folders[0].id;
    useOpenFiles.getState().renameFolder(folderId, "new-name");
    expect(useOpenFiles.getState().folders[0].name).toBe("new-name");
  });

  it("toggleFolder flips expanded from true to false", () => {
    useOpenFiles.getState().addFilesInNewFolder([{ name: "a.md", markdown: "" }], "f");
    const folderId = useOpenFiles.getState().folders[0].id;
    expect(useOpenFiles.getState().folders[0].expanded).toBe(true);
    useOpenFiles.getState().toggleFolder(folderId);
    expect(useOpenFiles.getState().folders[0].expanded).toBe(false);
  });

  it("toggleFolder flips expanded from false back to true", () => {
    useOpenFiles.getState().addFilesInNewFolder([{ name: "a.md", markdown: "" }], "f");
    const folderId = useOpenFiles.getState().folders[0].id;
    useOpenFiles.getState().toggleFolder(folderId);
    useOpenFiles.getState().toggleFolder(folderId);
    expect(useOpenFiles.getState().folders[0].expanded).toBe(true);
  });

  it("deleteFolder removes the folder and moves files to root", () => {
    useOpenFiles.getState().addFilesInNewFolder(
      [
        { name: "a.md", markdown: "# A" },
        { name: "b.md", markdown: "# B" },
      ],
      "my-folder"
    );
    const state = useOpenFiles.getState();
    const folderId = state.folders[0].id;
    const fileIds = state.files.map((f) => f.id);

    useOpenFiles.getState().deleteFolder(folderId);

    const next = useOpenFiles.getState();
    expect(next.folders).toHaveLength(0);
    expect(next.files).toHaveLength(2);
    next.files.forEach((f) => expect(f.folderId).toBeUndefined());
    expect(next.rootOrder).toEqual(expect.arrayContaining(fileIds));
    expect(next.rootOrder).not.toContain(folderId);
  });

  it("deleteFolder replaces folder id in rootOrder with childIds in order", () => {
    useOpenFiles.getState().addFiles([{ name: "root.md", markdown: "" }]);
    useOpenFiles.getState().addFilesInNewFolder(
      [
        { name: "a.md", markdown: "" },
        { name: "b.md", markdown: "" },
      ],
      "folder1"
    );
    const state = useOpenFiles.getState();
    const rootFileId = state.files.find((f) => f.name === "root.md")!.id;
    const folderId = state.folders[0].id;
    const [aId, bId] = state.folders[0].childIds;

    useOpenFiles.getState().deleteFolder(folderId);

    expect(useOpenFiles.getState().rootOrder).toEqual([rootFileId, aId, bId]);
  });

  it("moveFileToFolder moves a root file into the folder", () => {
    useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "" }]);
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "b.md", markdown: "" }], "folder1");
    const fileId = useOpenFiles.getState().files.find((f) => f.name === "a.md")!.id;
    const folderId = useOpenFiles.getState().folders[0].id;

    useOpenFiles.getState().moveFileToFolder(fileId, folderId);

    const next = useOpenFiles.getState();
    const movedFile = next.files.find((f) => f.id === fileId)!;
    expect(movedFile.folderId).toBe(folderId);
    expect(next.folders[0].childIds).toContain(fileId);
    expect(next.rootOrder).not.toContain(fileId);
  });

  it("moveFileToFolder from one folder to another folder", () => {
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "folder1");
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "b.md", markdown: "" }], "folder2");
    const fileId = useOpenFiles.getState().files.find((f) => f.name === "a.md")!.id;
    const folder1Id = useOpenFiles.getState().folders[0].id;
    const folder2Id = useOpenFiles.getState().folders[1].id;

    useOpenFiles.getState().moveFileToFolder(fileId, folder2Id);

    const next = useOpenFiles.getState();
    expect(next.files.find((f) => f.id === fileId)?.folderId).toBe(folder2Id);
    expect(next.folders.find((f) => f.id === folder1Id)?.childIds).not.toContain(fileId);
    expect(next.folders.find((f) => f.id === folder2Id)?.childIds).toContain(fileId);
  });

  it("moveFileToRoot moves a file from a folder back to root", () => {
    useOpenFiles.getState().addFilesInNewFolder(
      [
        { name: "a.md", markdown: "" },
        { name: "b.md", markdown: "" },
      ],
      "folder1"
    );
    const fileId = useOpenFiles.getState().files.find((f) => f.name === "a.md")!.id;
    const folderId = useOpenFiles.getState().folders[0].id;

    useOpenFiles.getState().moveFileToRoot(fileId);

    const next = useOpenFiles.getState();
    expect(next.files.find((f) => f.id === fileId)?.folderId).toBeUndefined();
    expect(next.folders.find((f) => f.id === folderId)?.childIds).not.toContain(fileId);
    expect(next.rootOrder).toContain(fileId);
  });

  it("closeFile removes the file from its folder childIds", () => {
    useOpenFiles.getState().addFilesInNewFolder(
      [
        { name: "a.md", markdown: "" },
        { name: "b.md", markdown: "" },
      ],
      "folder1"
    );
    const fileId = useOpenFiles.getState().files.find((f) => f.name === "a.md")!.id;
    const folderId = useOpenFiles.getState().folders[0].id;

    useOpenFiles.getState().closeFile(fileId);

    expect(
      useOpenFiles.getState().folders.find((f) => f.id === folderId)?.childIds
    ).not.toContain(fileId);
  });

  it("closing the last file resets folders and rootOrder", () => {
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "folder1");
    const fileId = useOpenFiles.getState().files[0].id;

    useOpenFiles.getState().closeFile(fileId);

    const state = useOpenFiles.getState();
    expect(state.folders).toHaveLength(0);
    expect(state.files).toHaveLength(1);
    expect(state.files[0].name).toBe("untitled.md");
    expect(state.rootOrder).toEqual([state.files[0].id]);
  });

  it("onRehydrateStorage migrates old flat data: sets empty folders and rootOrder from files", () => {
    localStorage.setItem(
      "markdown-editor-open-files",
      JSON.stringify({
        state: {
          files: [
            {
              id: "old-id",
              name: "legacy.md",
              path: "legacy.md",
              markdown: "# old",
              isDirty: false,
              reloadToken: 0,
              initialHash: "abc",
            },
          ],
          activeId: "old-id",
        },
        version: 0,
      })
    );

    useOpenFiles.persist.rehydrate();

    const state = useOpenFiles.getState();
    expect(state.folders).toEqual([]);
    expect(state.rootOrder).toContain("old-id");
    expect(state.files[0].folderId).toBeUndefined();
  });
});
