import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

vi.mock("@/components/tiptap/TiptapEditor", () => ({
  TiptapEditor: () => <div data-testid="tiptap-editor" />,
}));

describe("App", () => {
  it("renders the Markdown Editor logo", () => {
    render(<App />);
    expect(screen.getByAltText("Markdown Editor")).toBeInTheDocument();
  });
});
