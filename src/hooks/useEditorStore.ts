import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_MARKDOWN = `# Welcome to Markdown Editor

Start writing your markdown here.

## Features

- **Bold** and *italic* text
- [Links](https://example.com)
- \`inline code\` and code blocks
- Lists and headings

\`\`\`javascript
const greeting = "Hello, Markdown!";
console.log(greeting);
\`\`\`

> Blockquotes are supported too.

## Mermaid Diagrams

### Flowchart

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do something]
    B -->|No| D[Do something else]
    C --> E[End]
    D --> E
\`\`\`

### Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Browser
    participant Server
    participant DB

    Browser->>Server: GET /api/users
    Server->>DB: SELECT * FROM users
    DB-->>Server: Result set
    Server-->>Browser: 200 OK (JSON)
\`\`\`

### Class Diagram

\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +fetch() void
    }
    class Cat {
        +purr() void
    }
    Animal <|-- Dog
    Animal <|-- Cat
\`\`\`

### Gantt Chart

\`\`\`mermaid
gantt
    title Project Schedule
    dateFormat  YYYY-MM-DD
    section Design
    Wireframe       :done, d1, 2026-01-01, 7d
    Mockup          :done, d2, after d1, 5d
    section Development
    Frontend        :active, d3, after d2, 14d
    Backend         :d4, after d2, 14d
    section Testing
    QA              :d5, after d3, 7d
\`\`\`

### State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review : Submit
    Review --> Approved : Approve
    Review --> Draft : Request Changes
    Approved --> Published : Publish
    Published --> [*]
\`\`\`

### Pie Chart

\`\`\`mermaid
pie title Language Usage
    "TypeScript" : 45
    "Go" : 30
    "Python" : 15
    "Other" : 10
\`\`\`
`;

interface EditorState {
  markdown: string;
  updateMarkdown: (value: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      markdown: DEFAULT_MARKDOWN,
      updateMarkdown: (value) => set({ markdown: value }),
    }),
    { name: "markdown-editor-storage" },
  ),
);
