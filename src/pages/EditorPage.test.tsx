import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useEditorStore } from "@/hooks/useEditorStore";
import { EditorPage } from "./EditorPage";

describe("EditorPage", () => {
  it("renders editor textarea and preview", () => {
    useEditorStore.getState().updateMarkdown("# Editor Test");
    render(<EditorPage />);
    expect(screen.getByRole("textbox")).toHaveValue("# Editor Test");
    expect(
      screen.getByRole("heading", { level: 1, name: "Editor Test" })
    ).toBeInTheDocument();
  });
});
