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
  user!: User;

  @Column("text")
  prompt!: string;

  @Column({
    type: "enum",
    enum: Origin,
  })
  origin!: Origin;

  @Column({
    type: "boolean",
    default: true,
  })
  acknowledged!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
