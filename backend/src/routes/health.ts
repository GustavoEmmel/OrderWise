import express from "express";
import { isInitialized } from "../config/database";

const router = express.Router();

router.get("/", (req, res) => {
  if (isInitialized) {
    res.status(200).json({ status: "ok" });
  } else {
    res.status(500).json({ status: "error", message: "Database not initialized" });
  }
});

export default router;
