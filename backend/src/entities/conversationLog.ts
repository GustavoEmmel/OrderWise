import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./user";

export enum Origin {
  USER = "user",
  SYSTEM = "system",
}

@Entity("conversation_logs")
export class ConversationLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.id)
  user!: number;

  @Column("text")
  prompt!: string;

  @Column({
    type: "enum",
    enum: Origin,
  })
  origin!: Origin;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
