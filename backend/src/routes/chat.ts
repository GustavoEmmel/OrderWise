import { Router, Request, Response } from "express";
import { OrderStatus } from "../entities/order";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  // const chat = req.app.get("chatbotService");
  const orderService = req.orderService;
  const userId = 1;

  console.log("req.body", req.body);

  try {
    // const response = await chat.sendMessage("Hello, how are you?");

    // console.log("response", response);

    const order = await orderService.getOrCreateOpenOrder(userId);
    console.log("order", order);

    await orderService.updateOrderStatus(order.id, OrderStatus.OPEN);

    await orderService.addOrderItem(userId, {
      name: "Juice",
      description: "Plus 3 ice cubes",
      quantity: 2,
      unitPrice: 5.33,
      timeToPrepare: 5,
    });

    await orderService.closeOrder(userId);

    const activeOrder = await orderService.getUserActiveOrder(userId);
    console.log("activeOrder", activeOrder);

    res.json({ ok: true, activeOrder });
  } catch (err) {
    console.log("err", err);

    console.error("Failed to get a response from the chatbot:", err);
    res.status(500).json({ error: "Failed to get a response from the chatbot" });
  }
});

export default router;
