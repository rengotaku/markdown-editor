import { useEffect, useRef } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useGreetingStore } from "@/hooks/useGreetingStore";

export function GreetingPage() {
  const { name } = useParams<{ name: string }>();
  const { visitCount, incrementVisit } = useGreetingStore();
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (name && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementVisit(name);
    }
  }, [name, incrementVisit]);

  const decodedName = name ? decodeURIComponent(name) : "Guest";

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Hello, {decodedName}!
      </Typography>

      <Card sx={{ maxWidth: 400, mx: "auto", my: 4 }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            You are visitor #{visitCount}
          </Typography>
        </CardContent>
      </Card>

      <Button component={RouterLink} to="/greeting" variant="outlined" size="large">
        Try Another Name
      </Button>
    </Box>
  );
}
