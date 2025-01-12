import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./user";
import { OrderItem } from "./orderItem";

export enum OrderStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCEL = "cancel",
  REFUNDED = "refunded",
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.id)
  user!: number;

  @Column("decimal", { nullable: true })
  price?: number;

  @Column("decimal", { nullable: true })
  refundAmount?: number;

  @Column("varchar", { nullable: true })
  refundReason?: string;

  @Column({
    type: "varchar", // even thought its an enum, its better to store it as string in case we need to add another one latter
    enum: OrderStatus,
    default: OrderStatus.OPEN,
  })
  status!: OrderStatus;

  @Column({ type: "timestamp", nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  actualDeliveryDate?: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems?: OrderItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
