import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export function HomePage() {
  const features = [
    "Vite 8 + TypeScript 5.9",
    "React 19 + React Router",
    "Material UI 7",
    "Zustand (state management)",
    "React Hook Form + Zod (forms)",
    "Vitest + Testing Library",
    "Cloudflare Pages deployment",
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        React SPA Boilerplate
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        A standalone SPA boilerplate optimized for Cloudflare Pages deployment.
      </Typography>

      <Card sx={{ maxWidth: 400, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Features
          </Typography>
          <List dense disablePadding>
            {features.map((feature) => (
              <ListItem key={feature} disableGutters>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" component={RouterLink} to="/about">
          About
        </Button>
        <Button variant="outlined" component={RouterLink} to="/greeting">
          Greeting Demo
        </Button>
      </Stack>
    </Box>
  );
}
