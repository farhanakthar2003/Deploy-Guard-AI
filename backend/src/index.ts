import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import repoRoutes from "./routes/repos";
import webhookRoutes from "./routes/webhook";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Webhook route needs raw body for signature verification
// so it must be registered BEFORE express.json()
app.use("/webhook", express.raw({ type: "application/json" }), webhookRoutes);

// All other routes use JSON
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/repos", repoRoutes);

app.get("/", (req, res) => {
  res.send("DeployGuard Backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});