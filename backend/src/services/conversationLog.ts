import { ConversationLog, Origin } from "../entities/conversationLog";
import { ensureDatabaseConnection } from "../config/database";

import { Repository } from "typeorm";

export class ConversationLogService {
  private conversationLogRepository: Repository<ConversationLog>;

  constructor(conversationLogRepository: Repository<ConversationLog>) {
    this.conversationLogRepository = conversationLogRepository;
    this.initialize();
  }

  private async initialize() {
    await ensureDatabaseConnection(); // Ensure connection is established once connection was failing in Vercel
  }

  // Log a new conversation
  async logConversation(prompt: string, user: number, origin: Origin): Promise<void> {
    const newConversation = this.conversationLogRepository.create({ prompt, user, origin });
    await this.conversationLogRepository.save(newConversation);
  }

  async loadConversationLog(userId: number): Promise<ConversationLog[]> {
    return this.conversationLogRepository.find({ where: { user: userId } });
  }
}
