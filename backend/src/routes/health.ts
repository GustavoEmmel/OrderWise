import { Router, Request, Response } from "express";
import { DataSource } from "typeorm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const dataSource = req.app.get("dataSource") as DataSource;

  try {
    if (!dataSource.isInitialized) {
      res.status(500).json({ status: "error", message: "Database not connected" });
    }

    //Perform a database test
    await dataSource.query("SELECT 1");

    res.json({ status: "ok", message: "Server is healthy" });
  } catch (err) {
    console.error("Health check failed:", err);
    res
      .status(500)
      .json({ status: "error", message: "Health check failed", error: (err as Error).message });
  }
});

export default router;
