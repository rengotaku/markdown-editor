import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Layout } from "./Layout";
import { useOpenFiles } from "@/hooks/useOpenFiles";
import { useEditorInstance } from "@/hooks/useEditorInstance";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";
import type { DroppedFile } from "@/hooks/useFileDrop";

vi.mock("@/components/tiptap/TiptapEditor", () => ({
  TiptapEditor: () => <div data-testid="tiptap-editor" />,
}));

let capturedOnDropMarkdown: ((files: DroppedFile[]) => void) | null = null;

vi.mock("@/hooks/useFileDrop", () => ({
  useFileDrop: vi.fn(
    ({ onDropMarkdown }: { onDropMarkdown: (files: DroppedFile[]) => void }) => {
      capturedOnDropMarkdown = onDropMarkdown;
      return { isDragging: false };
    }
  ),
}));

describe("Layout header buttons", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], activeId: null });
    useSidebarPrefs.setState({ collapsed: true });
    capturedOnDropMarkdown = null;
  });

  it("disables copy/download/close-all when no file is open", () => {
    render(
      <Layout>
        <div />
      </Layout>
    );
    expect(screen.getByRole("button", { name: "copy markdown" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "export markdown" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "close all files" })).toBeDisabled();
  });

  it("enables copy/download/close-all after a file is added", () => {
    render(
      <Layout>
        <div />
      </Layout>
    );
    act(() => {
      useOpenFiles.getState().addFiles([{ name: "a.md", markdown: "# A" }]);
    });
    expect(screen.getByRole("button", { name: "copy markdown" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "export markdown" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "close all files" })).toBeEnabled();
  });
});

describe("Layout overwrite dialog", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], activeId: null });
    useEditorInstance.setState({ editor: null, scrollToTopToken: 0 });
    useSidebarPrefs.setState({ collapsed: true });
    capturedOnDropMarkdown = null;
  });

  it("shows overwrite dialog when a dropped file conflicts with an existing one", async () => {
    useOpenFiles.getState().addFiles([{ name: "report.md", markdown: "# Old" }]);
    render(
      <Layout>
        <div />
      </Layout>
    );

    act(() => {
      capturedOnDropMarkdown?.([{ name: "report.md", markdown: "# New" }]);
    });

    expect(await screen.findByText("同一ファイルがあります")).toBeInTheDocument();
    expect(screen.getByText("report.md")).toBeInTheDocument();
  });

  it("confirming overwrite activates the overwritten file", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "report.md", markdown: "# Old" },
    ]);
    const reportId = useOpenFiles
      .getState()
      .files.find((f) => f.name === "report.md")!.id;
    useOpenFiles
      .getState()
      .setActive(useOpenFiles.getState().files.find((f) => f.name === "a.md")!.id);

    render(
      <Layout>
        <div />
      </Layout>
    );

    act(() => {
      capturedOnDropMarkdown?.([{ name: "report.md", markdown: "# New" }]);
    });

    await screen.findByText("同一ファイルがあります");
    await user.click(screen.getByRole("button", { name: "上書き" }));

    expect(useOpenFiles.getState().activeId).toBe(reportId);
  });

  it("confirming overwrite requests scroll to top", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([{ name: "report.md", markdown: "# Old" }]);

    render(
      <Layout>
        <div />
      </Layout>
    );

    act(() => {
      capturedOnDropMarkdown?.([{ name: "report.md", markdown: "# New" }]);
    });

    await screen.findByText("同一ファイルがあります");

    const tokenBefore = useEditorInstance.getState().scrollToTopToken;
    await user.click(screen.getByRole("button", { name: "上書き" }));

    expect(useEditorInstance.getState().scrollToTopToken).toBe(tokenBefore + 1);
  });

  it("cancelling overwrite does not change active file or scroll", async () => {
    const user = userEvent.setup();
    useOpenFiles.getState().addFiles([
      { name: "a.md", markdown: "# A" },
      { name: "report.md", markdown: "# Old" },
    ]);
    const aId = useOpenFiles.getState().files.find((f) => f.name === "a.md")!.id;
    useOpenFiles.getState().setActive(aId);

    render(
      <Layout>
        <div />
      </Layout>
    );

    act(() => {
      capturedOnDropMarkdown?.([{ name: "report.md", markdown: "# New" }]);
    });

    await screen.findByText("同一ファイルがあります");
    const tokenBefore = useEditorInstance.getState().scrollToTopToken;
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(useOpenFiles.getState().activeId).toBe(aId);
    expect(useEditorInstance.getState().scrollToTopToken).toBe(tokenBefore);
  });
});
