import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { useOpenFiles } from "@/hooks/useOpenFiles";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], activeId: null });
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

  it("copies the file name via context menu", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    useOpenFiles.getState().addFiles([{ name: "alpha.md", markdown: "# A" }]);
    render(<Sidebar />);

    fireEvent.contextMenu(screen.getByText("alpha.md"));
    await user.click(screen.getByText("ファイル名をコピー"));

    expect(writeText).toHaveBeenCalledWith("alpha.md");
    expect(
      await screen.findByText("ファイル名をコピーしました")
    ).toBeInTheDocument();
  });

  it("renames a file via the context menu dialog", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([{ name: "alpha.md", markdown: "# A" }]);
    render(<Sidebar />);

    fireEvent.contextMenu(screen.getByText("alpha.md"));
    await user.click(screen.getByText("ファイル名を変更"));

    const input = screen.getByLabelText("rename file") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "renamed.md");
    await user.click(screen.getByRole("button", { name: "変更" }));

    expect(useOpenFiles.getState().files[0].name).toBe("renamed.md");
  });

  it("shows an error when renaming to a duplicate name", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([
      { name: "alpha.md", markdown: "# A" },
      { name: "beta.md", markdown: "# B" },
    ]);
    render(<Sidebar />);

    fireEvent.contextMenu(screen.getByText("alpha.md"));
    await user.click(screen.getByText("ファイル名を変更"));

    const input = screen.getByLabelText("rename file") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "beta.md");
    await user.click(screen.getByRole("button", { name: "変更" }));

    expect(
      screen.getByText("同じ名前のファイルがすでに開いています")
    ).toBeInTheDocument();
    expect(useOpenFiles.getState().files[0].name).toBe("alpha.md");
  });
});
