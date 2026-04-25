import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Layout } from "./Layout";
import { useOpenFiles } from "@/hooks/useOpenFiles";
import { useSidebarPrefs } from "@/hooks/useSidebarPrefs";

vi.mock("@/components/tiptap/TiptapEditor", () => ({
  TiptapEditor: () => <div data-testid="tiptap-editor" />,
}));

describe("Layout header buttons", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], activeId: null });
    useSidebarPrefs.setState({ collapsed: true });
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
