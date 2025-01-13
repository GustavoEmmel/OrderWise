import { ConversationLog, Origin } from "../entities/conversationLog";
import { ensureDatabaseConnection } from "../config/database";

import { Repository } from "typeorm";

export class ConversationLogService {
  private conversationLogRepository: Repository<ConversationLog>;

  constructor(conversationLogRepository: Repository<ConversationLog>) {
    this.conversationLogRepository = conversationLogRepository;
  }

  // Log a new conversation
  async logConversation(prompt: string, user: number, origin: Origin): Promise<void> {
    await ensureDatabaseConnection(); // Ensure connection is established

    const newConversation = this.conversationLogRepository.create({ prompt, user, origin });
    await this.conversationLogRepository.save(newConversation);
  }

  async loadConversationLog(userId: number): Promise<ConversationLog[]> {
    await ensureDatabaseConnection(); // Ensure connection is established

    return this.conversationLogRepository.find({ where: { user: userId } });
  }
}
