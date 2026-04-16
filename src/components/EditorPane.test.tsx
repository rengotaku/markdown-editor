import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { useEditorStore } from "@/hooks/useEditorStore";
import { EditorPane } from "./EditorPane";

describe("EditorPane", () => {
  it("renders textarea with store content", () => {
    useEditorStore.getState().updateMarkdown("# Test");
    render(<EditorPane />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("# Test");
  });

  it("updates store on input", async () => {
    useEditorStore.getState().updateMarkdown("");
    const user = userEvent.setup();
    render(<EditorPane />);
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "hello");
    expect(useEditorStore.getState().markdown).toBe("hello");
  });
});
