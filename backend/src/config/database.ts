import { DataSource } from "typeorm";
import { Order } from "../entities/order";
import { OrderItem } from "../entities/orderItem";
import { User } from "../entities/user";
import { ConversationLog } from "../entities/conversationLog";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "orderwise",
  entities: [Order, OrderItem, User, ConversationLog],
  migrations: ["src/migrations/*.ts"],
  logging: false, // Disable in production
  synchronize: true, // Disable in production
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

export let isInitialized = false;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    isInitialized = true;
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    isInitialized = false;
  });
