import { OrderService } from "./services/order";

declare global {
  namespace Express {
    interface Request {
      orderService: OrderService;
    }
  }
}
