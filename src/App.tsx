import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/theme";
import { Layout } from "@/components";
import { EditorPage } from "@/pages";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <EditorPage />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
