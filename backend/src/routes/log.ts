import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const conversationLogService = req.conversationLogService;

  try {
    const logs = await conversationLogService.loadConversationLog(1);
    res.json(logs);
  } catch (err) {
    console.error("Failed to get logs:", err);
    res.status(500).json({ error: "Failed to get logs" });
  }
});

export default router;
