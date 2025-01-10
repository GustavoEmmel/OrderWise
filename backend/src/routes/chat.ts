import { Router, Request, Response } from "express";
import { chatAgent } from "../services/chatAgent";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  // const chat = req.app.get("chatbotService");
  const orderService = req.orderService;

  console.log("req.body", req.body);

  try {
    const messages = [{ role: "user", content: "I want to order from McDonald's." }];

    const response = await chatAgent(messages, orderService);
    // console.log("process.env.OPENAI_API_KEY", process.env.OPENAI_API_KEY);
    console.log("response", response);

    res.json({ response });
  } catch (err) {
    console.log("err", err);

    console.error("Failed to get a response from the chatbot:", err);
    res.status(500).json({ error: "Failed to get a response from the chatbot" });
  }
});

export default router;
