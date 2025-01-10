import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Order } from "./order";
import { User } from "./user";

@Entity("refunds")
export class Refund {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.id)
  orderId!: number;

  @ManyToOne(() => User, (user) => user.id)
  user!: User;

  @Column("decimal")
  value!: number;

  @Column("text")
  reason!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
