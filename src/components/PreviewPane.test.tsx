import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useEditorStore } from "@/hooks/useEditorStore";
import { PreviewPane } from "./PreviewPane";

describe("PreviewPane", () => {
  it("renders markdown as HTML", () => {
    useEditorStore.getState().updateMarkdown("# Hello World");
    render(<PreviewPane />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Hello World" })
    ).toBeInTheDocument();
  });

  it("renders paragraph text", () => {
    useEditorStore.getState().updateMarkdown("Some paragraph text");
    render(<PreviewPane />);
    expect(screen.getByText("Some paragraph text")).toBeInTheDocument();
  });
});
