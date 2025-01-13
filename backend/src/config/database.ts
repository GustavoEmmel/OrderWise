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
  extra: {
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 60000, // 60 seconds
    idleTimeoutMillis: 60000, // 60 seconds
  },
});

export let isInitialized = false;

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function initializeDatabase(retries = 0): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");
    isInitialized = true;
  } catch (err) {
    console.error(`Database connection error: ${err}`);
    if (retries < MAX_RETRIES) {
      console.log(`Retrying to connect to the database (${retries + 1}/${MAX_RETRIES})...`);
      setTimeout(() => initializeDatabase(retries + 1), RETRY_DELAY);
    } else {
      console.error("Max retries reached. Could not connect to the database.");
      isInitialized = false;
    }
  }
}

initializeDatabase();
