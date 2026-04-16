import type { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" sx={{ flexShrink: 0 }}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div">
            Markdown Editor
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, overflow: "hidden" }}>
        {children}
      </Box>
    </Box>
  );
}
