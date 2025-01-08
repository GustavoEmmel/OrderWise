import { DataSource } from "typeorm";
import { Server as WebSocketServer } from "ws";

// Define application dependencies
export interface AppDependencies {
  dataSource: DataSource; // TypeORM data source
  wsServer: WebSocketServer; // WebSocket server instance
}

// Standard response format
export interface ApiResponse<T = any> {
  status: "ok" | "error";
  message: string;
  data?: T;
  error?: string;
}

// Types for order management
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: "pending" | "in progress" | "completed" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  quantity: number;
  price: number;
}

// Types for WebSocket events
export interface WebSocketEvent {
  event: string;
  payload: any;
}
