import { Router, Request, Response } from "express";
import { chatAgent } from "../services/chatAgent";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const orderService = req.orderService;

  try {
    const messages = req.body.messages;

    const response = await chatAgent(messages, orderService);
    console.log("response", response);

    res.json({ response });
  } catch (err) {
    console.log("err", err);

    console.error("Failed to get a response from the chatbot:", err);
    res.status(500).json({ error: "Failed to get a response from the chatbot" });
  }
});

export default router;
