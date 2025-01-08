import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import { initializeWebSocketServer } from "./plugins/websocket-server";
import healthRouter from "./routes/health";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limit configuration
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "You have exceeded the 1000 requests in 24 hrs limit!",
  headers: true,
});

// Apply rate limit to all requests
app.use(limiter);

// Initialize Database
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.set("dataSource", AppDataSource); // Attach AppDataSource to app
  })
  .catch((err) => console.error("Database connection error:", err));

// Initialize WebSocket
initializeWebSocketServer(4000);

// Middleware
app.use(express.json());

app.use("/health", healthRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
