import { useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Markdown from "react-markdown";
import mermaid from "mermaid";
import { useEditorStore } from "@/hooks/useEditorStore";

mermaid.initialize({ startOnLoad: false, theme: "default" });

function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const renderDiagram = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    try {
      const { svg } = await mermaid.render(id, code);
      el.innerHTML = svg;
    } catch {
      el.innerHTML = `<pre style="color: #d32f2f; font-size: 0.85em;">Invalid mermaid syntax</pre>`;
    }
  }, [code]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  return <div ref={containerRef} />;
}

export function PreviewPane() {
  const markdown = useEditorStore((s) => s.markdown);

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        p: 2,
        "& h1": { fontSize: "2em", fontWeight: 700, mb: 1, mt: 0, borderBottom: "1px solid #eee", pb: 0.5 },
        "& h2": { fontSize: "1.5em", fontWeight: 600, mb: 1, mt: 2, borderBottom: "1px solid #eee", pb: 0.5 },
        "& h3": { fontSize: "1.25em", fontWeight: 600, mb: 1, mt: 1.5 },
        "& p": { mb: 1 },
        "& code": {
          backgroundColor: "#f5f5f5",
          px: 0.5,
          py: 0.25,
          borderRadius: "3px",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: "0.875em",
        },
        "& pre": {
          backgroundColor: "#f5f5f5",
          p: 2,
          borderRadius: 1,
          overflow: "auto",
          "& code": { backgroundColor: "transparent", p: 0 },
        },
        "& blockquote": {
          borderLeft: "4px solid #ddd",
          pl: 2,
          ml: 0,
          color: "#666",
        },
        "& a": { color: "#0066cc" },
        "& ul, & ol": { pl: 3 },
        "& table": {
          borderCollapse: "collapse",
          width: "100%",
          "& th, & td": { border: "1px solid #ddd", p: 1 },
          "& th": { backgroundColor: "#f5f5f5", fontWeight: 600 },
        },
        "& img": { maxWidth: "100%" },
      }}
    >
      <Markdown
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match?.[1];
            const codeStr = String(children).replace(/\n$/, "");

            if (lang === "mermaid") {
              return <MermaidBlock code={codeStr} />;
            }

            return (
              <code className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {markdown}
      </Markdown>
    </Box>
  );
}
