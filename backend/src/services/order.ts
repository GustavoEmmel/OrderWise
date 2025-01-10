import { Repository, In } from "typeorm";
import { Order, OrderStatus } from "../entities/order";
import { OrderItem } from "../entities/orderItem";

export class OrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;

  constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
  }

  async getOrCreateOpenOrder(userId: number): Promise<Order> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const existingOrder = await this.getUserActiveOrder(userId);

      if (existingOrder) {
        return existingOrder;
      }

      const order = this.orderRepository.create({ user: userId, status: OrderStatus.OPEN });

      return await transactionalEntityManager.save(order);
    });
  }

  async addOrderItem(
    userId: number,
    orderItemData: Omit<OrderItem, "id" | "order" | "createdAt" | "updatedAt">
  ): Promise<OrderItem> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const order = await this.getOrCreateOpenOrder(userId);

      orderItemData.finalPrice = orderItemData.unitPrice * orderItemData.quantity;

      const orderItem = this.orderItemRepository.create({
        ...orderItemData,
        order,
      });

      await transactionalEntityManager.save(orderItem);
      // Set order to open again
      order.status = OrderStatus.OPEN;

      if (!order.orderItems) {
        order.orderItems = [];
      }
      order.orderItems.push(orderItem);
      await transactionalEntityManager.save(order);

      return orderItem;
    });
  }

  async modifyOrderItem(
    userId: number,
    itemName: string,
    newItemData: Omit<OrderItem, "id" | "order" | "createdAt" | "updatedAt">
  ): Promise<OrderItem> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const order = await this.getOrCreateOpenOrder(userId);

      if (!order.orderItems || order.orderItems.length === 0) {
        throw new Error("No items found in order to modify");
      }

      // Find and remove the existing order item with the specified itemName (case insensitive)
      const existingItemIndex = order.orderItems.findIndex(
        (item) => item.name.toLowerCase() === itemName.toLowerCase()
      );
      if (existingItemIndex !== -1) {
        const existingItem = order.orderItems[existingItemIndex];
        await transactionalEntityManager.remove(existingItem);
        order.orderItems.splice(existingItemIndex, 1);
      }

      newItemData.finalPrice = newItemData.unitPrice * newItemData.quantity;

      // Add the new order item to the order
      const newOrderItem = this.orderItemRepository.create({
        ...newItemData,
        order,
      });

      // Set order to open again
      order.status = OrderStatus.OPEN;
      order.orderItems.push(newOrderItem);
      await transactionalEntityManager.save(order);

      return transactionalEntityManager.save(newOrderItem);
    });
  }

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      if (status === OrderStatus.COMPLETED) {
        return transactionalEntityManager.save(Order, {
          id: orderId,
          status,
          actualDeliveryDate: new Date(),
        });
      }

      return transactionalEntityManager.save(Order, { id: orderId, status });
    });
  }

  async refund(userId: number): Promise<Order> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const order = await transactionalEntityManager.findOne(Order, {
        where: {
          user: userId,
          status: In([OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED]),
        },
        order: {
          createdAt: "DESC",
        },
      });

      if (!order) {
        throw new Error("No order found to refund");
      }

      if (order.status === OrderStatus.REFUNDED) {
        throw new Error("Order is already refunded");
      }

      order.status = OrderStatus.REFUNDED;
      order.refundAmount = order.price;

      return transactionalEntityManager.save(order);
    });
  }

  async getUserActiveOrder(userId: number): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: {
        user: userId,
        status: In([OrderStatus.OPEN, OrderStatus.IN_PROGRESS]),
      },
      relations: ["user", "orderItems"],
    });
  }

  async hasOpenOrderWithItems(userId: number): Promise<boolean> {
    const order = await this.orderRepository.findOne({
      where: {
        user: userId,
        status: OrderStatus.OPEN,
      },
      relations: ["orderItems"],
    });

    return !!order && !!order.orderItems && order.orderItems.length > 0;
  }

  async closeOrder(userId: number): Promise<Order> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const order = await transactionalEntityManager.findOne(Order, {
        where: {
          user: userId,
          status: OrderStatus.OPEN,
        },
        relations: ["orderItems"],
      });

      if (!order) {
        throw new Error("No open order found to close");
      }

      if (!order.orderItems || order.orderItems.length === 0) {
        throw new Error("No items found in order to close");
      }

      // Set the order status to IN_PROGRESS
      order.status = OrderStatus.IN_PROGRESS;

      // Calculate the total price based on the finalPrice of order items
      order.price = order.orderItems.reduce((total, item) => total + Number(item.finalPrice), 0);

      // Get the maximum timeToPrepare in minutes and sum to the current time
      const maxTimeToPrepare = Math.max(...order.orderItems.map((item) => item.timeToPrepare));
      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setMinutes(expectedDeliveryDate.getMinutes() + maxTimeToPrepare);
      order.expectedDeliveryDate = expectedDeliveryDate;

      return transactionalEntityManager.save(order);
    });
  }
}
