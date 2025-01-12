import { OrderService } from "./services/order";
import { ConversationLogService } from "./services/conversationLog";

declare global {
  namespace Express {
    interface Request {
      orderService: OrderService;
      conversationLogService: ConversationLogService;
    }
  }
}
