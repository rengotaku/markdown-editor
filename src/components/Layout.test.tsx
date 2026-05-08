import {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
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

describe("Layout conflict dialog", () => {
  beforeEach(() => {
    localStorage.clear();
    useOpenFiles.setState({ files: [], activeId: null });
    useSidebarPrefs.setState({ collapsed: true });
  });

  function dropFiles(
    container: HTMLElement,
    files: Array<{ name: string; path?: string; content?: string }>
  ) {
    const fileObjects = files.map(({ name, path, content = "" }) => {
      const file = new File([content], name, { type: "text/markdown" });
      if (path !== undefined) {
        Object.defineProperty(file, "webkitRelativePath", { value: path });
      }
      return file;
    });

    const dataTransfer = {
      files: fileObjects,
      items: fileObjects.map((f) => ({ kind: "file", type: f.type, getAsFile: () => f })),
      types: ["Files"],
    };

    fireEvent.dragEnter(container, { dataTransfer });
    fireEvent.dragOver(container, { dataTransfer });
    fireEvent.drop(container, { dataTransfer });
  }

  it("shows 3-button conflict dialog when same-path file is dropped", async () => {
    act(() => {
      useOpenFiles.getState().addFiles([{ name: "a.md", path: "a.md", markdown: "old" }]);
    });

    const { container } = render(
      <Layout>
        <div />
      </Layout>
    );

    await act(async () => {
      dropFiles(container.firstElementChild as HTMLElement, [
        { name: "a.md", path: "a.md", content: "new" },
      ]);
    });

    expect(await screen.findByText("同名ファイルが存在します")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "別名をつける" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上書きする" })).toBeInTheDocument();
  });

  it("overwrites the file when 上書きする is clicked", async () => {
    act(() => {
      useOpenFiles.getState().addFiles([{ name: "a.md", path: "a.md", markdown: "old" }]);
    });

    const { container } = render(
      <Layout>
        <div />
      </Layout>
    );

    await act(async () => {
      dropFiles(container.firstElementChild as HTMLElement, [
        { name: "a.md", path: "a.md", content: "new content" },
      ]);
    });

    await screen.findByText("同名ファイルが存在します");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "上書きする" }));
    });

    await waitForElementToBeRemoved(() => screen.queryByText("同名ファイルが存在します"));
    const updated = useOpenFiles.getState().files.find((f) => f.name === "a.md");
    expect(updated?.markdown).toBe("new content");
  });

  it("closes the dialog when キャンセル is clicked", async () => {
    act(() => {
      useOpenFiles.getState().addFiles([{ name: "a.md", path: "a.md", markdown: "old" }]);
    });

    const { container } = render(
      <Layout>
        <div />
      </Layout>
    );

    await act(async () => {
      dropFiles(container.firstElementChild as HTMLElement, [
        { name: "a.md", path: "a.md", content: "new" },
      ]);
    });

    await screen.findByText("同名ファイルが存在します");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    });

    await waitForElementToBeRemoved(() => screen.queryByText("同名ファイルが存在します"));
    const file = useOpenFiles.getState().files.find((f) => f.name === "a.md");
    expect(file?.markdown).toBe("old");
  });

  it("saves file as _v2 automatically when 別名をつける is clicked", async () => {
    act(() => {
      useOpenFiles.getState().addFiles([{ name: "a.md", path: "a.md", markdown: "old" }]);
    });

    const { container } = render(
      <Layout>
        <div />
      </Layout>
    );

    await act(async () => {
      dropFiles(container.firstElementChild as HTMLElement, [
        { name: "a.md", path: "a.md", content: "new content" },
      ]);
    });

    await screen.findByText("同名ファイルが存在します");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "別名をつける" }));
    });

    await waitForElementToBeRemoved(() => screen.queryByText("同名ファイルが存在します"));
    const original = useOpenFiles.getState().files.find((f) => f.name === "a.md");
    const renamed = useOpenFiles.getState().files.find((f) => f.name === "a_v2.md");
    expect(original?.markdown).toBe("old");
    expect(renamed?.markdown).toBe("new content");
  });

  it("uses _v3 when _v2 already exists", async () => {
    act(() => {
      useOpenFiles.getState().addFiles([
        { name: "a.md", path: "a.md", markdown: "old" },
        { name: "a_v2.md", path: "a_v2.md", markdown: "v2" },
      ]);
    });

    const { container } = render(
      <Layout>
        <div />
      </Layout>
    );

    await act(async () => {
      dropFiles(container.firstElementChild as HTMLElement, [
        { name: "a.md", path: "a.md", content: "new content" },
      ]);
    });

    await screen.findByText("同名ファイルが存在します");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "別名をつける" }));
    });

    await waitForElementToBeRemoved(() => screen.queryByText("同名ファイルが存在します"));
    const renamed = useOpenFiles.getState().files.find((f) => f.name === "a_v3.md");
    expect(renamed?.markdown).toBe("new content");
  });

  it("adds same-name different-path file without dialog", async () => {
    act(() => {
      useOpenFiles
        .getState()
        .addFiles([{ name: "a.md", path: "folder1/a.md", markdown: "original" }]);
    });

    const { container } = render(
      <Layout>
        <div />
      </Layout>
    );

    await act(async () => {
      dropFiles(container.firstElementChild as HTMLElement, [
        { name: "a.md", path: "folder2/a.md", content: "from folder2" },
      ]);
    });

    expect(screen.queryByText("同名ファイルが存在します")).not.toBeInTheDocument();
    await waitFor(() => {
      const allFiles = useOpenFiles.getState().files;
      const instances = allFiles.filter((f) => f.name === "a.md");
      expect(instances).toHaveLength(2);
    });
  });
});
