import { Router, Request, Response } from "express";
import { chatAgent } from "../services/chatAgent";
import { Origin } from "../entities/conversationLog";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { orderService, conversationLogService } = req;

  try {
    const messages = req.body.messages;

    for (const message of messages) {
      if (typeof message !== "string") {
        const { content } = message;
        await conversationLogService.logConversation(content, 1, Origin.USER);
      }
    }

    const response = await chatAgent(messages, orderService);
    console.log("response", response);

    await conversationLogService.logConversation(response.reply, 1, Origin.SYSTEM);

    res.json({ response });
  } catch (err) {
    console.log("err", err);

    console.error("Failed to get a response from the chatbot:", err);
    res.status(500).json({ error: "Failed to get a response from the chatbot" });
  }
});

export default router;
