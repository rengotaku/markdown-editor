import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { Sidebar } from "./Sidebar";
import { useOpenFiles } from "@/hooks/useOpenFiles";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";

describe("Sidebar", () => {
  beforeEach(() => {
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

  it("toggles collapsed state via the sidebar button", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: "collapse sidebar" }));
    expect(useSidebarPrefs.getState().collapsed).toBe(true);
    await user.click(screen.getByRole("button", { name: "expand sidebar" }));
    expect(useSidebarPrefs.getState().collapsed).toBe(false);
  });
});
