import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useGreetingStore } from "@/hooks/useGreetingStore";

const nameSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

type NameFormData = z.infer<typeof nameSchema>;

export function GreetingForm() {
  const navigate = useNavigate();
  const { visitCount, lastVisitor } = useGreetingStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
  });

  const onSubmit = (data: NameFormData) => {
    navigate(`/greeting/${encodeURIComponent(data.name)}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Greeting Demo
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Enter your name to receive a personalized greeting.
      </Typography>

      {visitCount > 0 && (
        <Card sx={{ mb: 3, bgcolor: "primary.light" }}>
          <CardContent>
            <Typography variant="body2" color="primary.contrastText">
              Total visits: {visitCount}
              {lastVisitor && ` | Last visitor: ${lastVisitor}`}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 400 }}>
        <TextField
          {...register("name")}
          label="Your Name"
          fullWidth
          margin="normal"
          error={!!errors.name}
          helperText={errors.name?.message}
          autoFocus
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Say Hello
        </Button>
      </Box>
    </Box>
  );
}
