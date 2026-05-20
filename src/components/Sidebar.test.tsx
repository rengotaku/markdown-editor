import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { Sidebar } from "./Sidebar";
import { useOpenFiles } from "@/hooks/useOpenFiles";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], folders: [], rootOrder: [], activeId: null });
    useSidebarPrefs.setState({ collapsed: false });
  });

  it("shows empty hint when no files are open", () => {
    render(<Sidebar />);
    expect(
      screen.getByText("マークダウンファイルをドロップして開始")
    ).toBeInTheDocument();
  });

  it("lists opened files and highlights the active one", () => {
    useOpenFiles.getState().addFiles([
      { name: "alpha.md", markdown: "# A" },
      { name: "beta.md", markdown: "# B" },
    ]);
    render(<Sidebar />);
    expect(screen.getByText("alpha.md")).toBeInTheDocument();
    expect(screen.getByText("beta.md")).toBeInTheDocument();
  });

  it("switches active file on click", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([
      { name: "alpha.md", markdown: "# A" },
      { name: "beta.md", markdown: "# B" },
    ]);
    const betaId = useOpenFiles.getState().files[1].id;

    render(<Sidebar />);
    await user.click(screen.getByText("beta.md"));

    expect(useOpenFiles.getState().activeId).toBe(betaId);
  });

  it("closes non-dirty file immediately", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([{ name: "alpha.md", markdown: "# A" }]);
    render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: "close alpha.md" }));

    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].name).toBe("untitled.md");
  });

  it("prompts confirmation before closing a dirty file", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([{ name: "alpha.md", markdown: "# A" }]);
    useOpenFiles.getState().updateActiveMarkdown("# A2");

    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "close alpha.md" }));

    expect(useOpenFiles.getState().files).toHaveLength(1);
    expect(screen.getByText(/編集されています/, { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "閉じる" }));
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].name).toBe("untitled.md");
  });

  it("creates a new untitled file when the + button is clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "new untitled file" }));
    const state = useOpenFiles.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0].name).toBe("untitled.md");
    expect(state.activeId).toBe(state.files[0].id);
  });

  it("toggles collapsed state via the sidebar button", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "collapse sidebar" }));
    expect(useSidebarPrefs.getState().collapsed).toBe(true);
    await user.click(screen.getByRole("button", { name: "expand sidebar" }));
    expect(useSidebarPrefs.getState().collapsed).toBe(false);
  });
});

describe("Sidebar - folder support", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], folders: [], rootOrder: [], activeId: null });
    useSidebarPrefs.setState({ collapsed: false });
  });

  it("shows folder name when a folder exists", () => {
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "MyFolder");
    render(<Sidebar />);
    expect(screen.getByText("MyFolder")).toBeInTheDocument();
  });

  it("shows folder files when folder is expanded", () => {
    useOpenFiles.getState().addFilesInNewFolder(
      [
        { name: "a.md", markdown: "" },
        { name: "b.md", markdown: "" },
      ],
      "MyFolder"
    );
    render(<Sidebar />);
    expect(screen.getByText("a.md")).toBeInTheDocument();
    expect(screen.getByText("b.md")).toBeInTheDocument();
  });

  it("hides folder files when folder is collapsed", async () => {
    const user = userEvent.setup();
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "MyFolder");
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "MyFolder を閉じる" }));
    expect(screen.queryByText("a.md")).not.toBeInTheDocument();
  });

  it("clicking folder toggle button calls toggleFolder", async () => {
    const user = userEvent.setup();
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "Folder1");
    const folderId = useOpenFiles.getState().folders[0].id;
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "Folder1 を閉じる" }));
    expect(useOpenFiles.getState().folders.find((f) => f.id === folderId)?.expanded).toBe(
      false
    );
  });

  it("renames folder via inline edit", async () => {
    const user = userEvent.setup();
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "OldName");
    const folderId = useOpenFiles.getState().folders[0].id;
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "OldName をリネーム" }));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "NewName");
    await user.keyboard("{Enter}");
    expect(useOpenFiles.getState().folders.find((f) => f.id === folderId)?.name).toBe(
      "NewName"
    );
  });

  it("shows folder delete confirmation dialog when delete button clicked", async () => {
    const user = userEvent.setup();
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "DeleteMe");
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "DeleteMe を削除" }));
    expect(screen.getByText(/フォルダを削除/)).toBeInTheDocument();
  });

  it("deletes folder and moves files to root when confirmed", async () => {
    const user = userEvent.setup();
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "a.md", markdown: "" }], "DeleteMe");
    const folderId = useOpenFiles.getState().folders[0].id;
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "DeleteMe を削除" }));
    await user.click(screen.getByRole("button", { name: "削除" }));
    expect(
      useOpenFiles.getState().folders.find((f) => f.id === folderId)
    ).toBeUndefined();
    expect(useOpenFiles.getState().files[0].folderId).toBeUndefined();
  });

  it("dropping a file id on a folder row moves the file to that folder", () => {
    useOpenFiles.getState().addFiles([{ name: "root.md", markdown: "" }]);
    useOpenFiles
      .getState()
      .addFilesInNewFolder([{ name: "inner.md", markdown: "" }], "Folder1");
    const rootFileId = useOpenFiles
      .getState()
      .files.find((f) => f.name === "root.md")!.id;
    const folderId = useOpenFiles.getState().folders[0].id;

    render(<Sidebar />);
    const folderRow = screen
      .getByText("Folder1")
      .closest("[data-testid='folder-drop-zone']")!;

    fireEvent.drop(folderRow, {
      dataTransfer: { getData: () => rootFileId },
    });

    expect(useOpenFiles.getState().files.find((f) => f.id === rootFileId)?.folderId).toBe(
      folderId
    );
    expect(
      useOpenFiles.getState().folders.find((f) => f.id === folderId)?.childIds
    ).toContain(rootFileId);
  });

  it("dropping a file id on the root area moves folder file back to root", () => {
    useOpenFiles.getState().addFilesInNewFolder(
      [
        { name: "a.md", markdown: "" },
        { name: "b.md", markdown: "" },
      ],
      "Folder1"
    );
    const fileId = useOpenFiles.getState().files.find((f) => f.name === "a.md")!.id;

    render(<Sidebar />);
    const rootDropArea = screen.getByTestId("sidebar-root-drop");

    fireEvent.drop(rootDropArea, {
      dataTransfer: { getData: () => fileId },
    });

    expect(
      useOpenFiles.getState().files.find((f) => f.id === fileId)?.folderId
    ).toBeUndefined();
  });
});
