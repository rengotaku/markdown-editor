import { describe, it, expect } from "vitest";
import { simpleHash, buildFixFilename } from "./hash";

describe("simpleHash", () => {
  it("returns the same hash for identical strings", () => {
    expect(simpleHash("hello")).toBe(simpleHash("hello"));
  });

  it("returns different hashes for different strings", () => {
    expect(simpleHash("hello")).not.toBe(simpleHash("world"));
  });

  it("handles empty string", () => {
    expect(simpleHash("")).toBe(simpleHash(""));
  });
});

describe("buildFixFilename", () => {
  it("appends _fix before extension", () => {
    expect(buildFixFilename("document.md")).toBe("document_fix.md");
  });

  it("handles files with no extension", () => {
    expect(buildFixFilename("README")).toBe("README_fix");
  });

  it("handles dotfiles (leading dot counts as no extension)", () => {
    expect(buildFixFilename(".env")).toBe(".env_fix");
  });

  it("handles multiple dots correctly", () => {
    expect(buildFixFilename("my.notes.md")).toBe("my.notes_fix.md");
  });
});
