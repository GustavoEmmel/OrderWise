import dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import express from "express";

import { AppDataSource } from "./config/database";
import { initializeWebSocketServer } from "./plugins/websocket-server";
import healthRouter from "./routes/health";
import chatRouter from "./routes/chat";
import rateLimit from "express-rate-limit";
import { orderServiceProvider } from "./middlewares/orderServiceProvider";

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
  })
  .catch((err) => console.error("Database connection error:", err));

// Initialize WebSocket
initializeWebSocketServer(4000);

// Middleware
app.use(express.json());
app.use(orderServiceProvider); // Use the service provider middleware

app.use("/health", healthRouter);
app.use("/chat", chatRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
