import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Order } from "./order";

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.id)
  order!: Order;

  @Column({ type: "varchar" })
  name!: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column("int")
  quantity!: number;

  @Column("decimal")
  unitPrice!: number;

  @Column("decimal")
  finalPrice?: number;

  @Column("int") // in minutes
  timeToPrepare!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
