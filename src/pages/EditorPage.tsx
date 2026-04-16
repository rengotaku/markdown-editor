import Box from "@mui/material/Box";
import { Group, Panel, Separator } from "react-resizable-panels";
import { EditorPane } from "@/components/EditorPane";
import { PreviewPane } from "@/components/PreviewPane";

export function EditorPage() {
  return (
    <Box sx={{ height: "100%", overflow: "hidden" }}>
      <Group orientation="horizontal">
        <Panel defaultSize={50} minSize={20}>
          <EditorPane />
        </Panel>
        <Separator
          style={{
            width: "4px",
            backgroundColor: "#e0e0e0",
            cursor: "col-resize",
            transition: "background-color 0.2s",
          }}
        />
        <Panel defaultSize={50} minSize={20}>
          <PreviewPane />
        </Panel>
      </Group>
    </Box>
  );
}
