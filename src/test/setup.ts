import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock localStorage for Zustand persist middleware
const store: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  },
  writable: true,
});

// Mock react-resizable-panels (uses ResizeObserver which jsdom doesn't support)
vi.mock("react-resizable-panels", () => ({
  Group: ({ children }: { children: React.ReactNode }) => children,
  Panel: ({ children }: { children: React.ReactNode }) => children,
  Separator: () => null,
}));
