import { Router, Request, Response } from "express";
import { validateSchema } from "../middlewares/validateSchema";
import { z } from "zod";
import { OrderStatus } from "../entities/order";

const orderSchema = z.object({
  status: z.enum(Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]]),
});

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const orderService = req.orderService;

  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (err) {
    console.error("Failed to get orders:", err);
    res.status(500).json({ error: "Failed to get orders" });
  }
});

router.patch("/:id", validateSchema(orderSchema), async (req: Request, res: Response) => {
  const orderService = req.orderService;
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await orderService.updateOrderStatus(parseInt(id, 10), status);
    res.json(updatedOrder);
  } catch (err) {
    console.error("Failed to update order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
