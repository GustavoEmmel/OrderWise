import { Request, Response, NextFunction } from "express";
import { Repository } from "typeorm";
import { ConversationLog } from "../entities/conversationLog";
import { AppDataSource } from "../config/database";
import { ConversationLogService } from "../services/conversationLog";

export const conversationLogServiceProvider = (req: Request, res: Response, next: NextFunction) => {
  const conversationLogRepository: Repository<ConversationLog> =
    AppDataSource.getRepository(ConversationLog);

  req.conversationLogService = new ConversationLogService(conversationLogRepository);
  next();
};
