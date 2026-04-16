import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export function AboutPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        About
      </Typography>

      <Typography variant="body1" paragraph>
        This is a React SPA boilerplate designed for deployment on Cloudflare Pages. It
        includes a modern tech stack with TypeScript, Material UI, and comprehensive
        testing setup.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        SPA Routing
      </Typography>

      <Typography variant="body1" paragraph>
        This page demonstrates client-side routing. You can access this page directly via
        URL or by navigating from the home page. The Cloudflare Pages configuration
        ensures proper fallback routing for SPA navigation.
      </Typography>

      <Button variant="contained" component={RouterLink} to="/">
        Back to Home
      </Button>
    </Box>
  );
}
