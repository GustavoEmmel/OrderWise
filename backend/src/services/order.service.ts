import { Repository } from "typeorm";
import { Order } from "../entities/order";
import { AppDataSource } from "../config/database";

export class OrderService {
  private orderRepository: Repository<Order>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  async createOrder(userId: string, item: string, price: number): Promise<Order> {
    const order = this.orderRepository.create({ userId, item, price, status: "pending" });
    return await this.orderRepository.save(order);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | null> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) return null;

    order.status = status;
    return await this.orderRepository.save(order);
  }

  async getOrderById(id: number): Promise<Order | null> {
    return await this.orderRepository.findOneBy({ id });
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.find();
  }
}
