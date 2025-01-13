export interface ChatMessage {
  id: number;
  prompt: string;
  origin: "user" | "system";
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  name: string;
  description: string;
  notes: string | null;
  quantity: number;
  unitPrice: string;
  finalPrice: string;
  timeToPrepare: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  user: {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  price: string;
  refundAmount: string | null;
  refundReason: string | null;
  status: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string | null;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
