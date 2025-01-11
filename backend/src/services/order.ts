import { Repository, In } from "typeorm";
import { Order, OrderStatus } from "../entities/order";
import { OrderItem } from "../entities/orderItem";

/**
 * Service to manage orders and their related operations.
 * Designed to minimize user input while interacting with the chatbot.
 */
export class OrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;

  constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
  }

  /**
   * Fetches an open order for the user or creates a new one if none exists.
   * @param userId - The ID of the user.
   * @returns The open order.
   */
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

  /**
   * Adds an item to the user's open order. If no open order exists, a new one is created.
   * @param userId - The ID of the user.
   * @param orderItemData - Data for the order item.
   * @returns The newly added order item.
   */
  async addOrderItem(
    userId: number,
    orderItemData:
      | Omit<OrderItem, "id" | "order" | "createdAt" | "updatedAt">
      | Omit<OrderItem, "id" | "order" | "createdAt" | "updatedAt">[]
  ): Promise<OrderItem | OrderItem[]> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const order = await this.getOrCreateOpenOrder(userId);

      const orderItems = Array.isArray(orderItemData) ? orderItemData : [orderItemData];

      const savedOrderItems: OrderItem[] = [];

      console.log("orderItems", orderItems);
      console.log("orderItemData", orderItemData);

      for (const itemData of orderItems) {
        console.log("orderItemData", itemData);

        // Calculate the final price of the item.
        itemData.finalPrice = itemData.unitPrice * itemData.quantity;

        const orderItem = this.orderItemRepository.create({
          ...itemData,
          order,
        });

        console.log("orderItem", orderItem);

        // Save the order item and update the order status.
        await transactionalEntityManager.save(orderItem);
        savedOrderItems.push(orderItem);
      }

      order.status = OrderStatus.OPEN;

      if (!order.orderItems) {
        order.orderItems = [];
      }
      order.orderItems.push(...savedOrderItems);
      await transactionalEntityManager.save(order);

      return Array.isArray(orderItemData) ? savedOrderItems : savedOrderItems[0];
    });
  }

  /**
   * Modifies an existing item in the user's open order or replaces it with a new item.
   * @param userId - The ID of the user.
   * @param itemName - Name of the item to modify.
   * @param newItemData - Data for the new or updated item.
   * @returns The modified or newly added order item.
   */
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

      // Find and remove the existing order item by name.
      const existingItemIndex = order.orderItems.findIndex(
        (item) => item.name.toLowerCase() === itemName.toLowerCase()
      );
      if (existingItemIndex !== -1) {
        const existingItem = order.orderItems[existingItemIndex];
        await transactionalEntityManager.remove(existingItem);
        order.orderItems.splice(existingItemIndex, 1);
      }

      newItemData.finalPrice = newItemData.unitPrice * newItemData.quantity;

      // Add the new item to the order.
      const newOrderItem = this.orderItemRepository.create({
        ...newItemData,
        order,
      });

      order.status = OrderStatus.OPEN;
      order.orderItems.push(newOrderItem);
      await transactionalEntityManager.save(order);

      return transactionalEntityManager.save(newOrderItem);
    });
  }

  /**
   * Updates the status of an order.
   * @param orderId - The ID of the order.
   * @param status - The new status of the order.
   * @returns The updated order.
   */
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

  /**
   * Processes a refund for the user's most recent completed or in-progress order.
   * @param userId - The ID of the user.
   * @param reason - The reason for the refund (optional).
   * @returns The refunded order.
   */
  async refund(userId: number, reason?: string): Promise<Order> {
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
      if (reason) {
        order.refundReason = reason;
      }

      return transactionalEntityManager.save(order);
    });
  }

  /**
   * Fetches the user's active order (open or in progress).
   * @param userId - The ID of the user.
   * @returns The active order, if any.
   */
  async getUserActiveOrder(userId: number): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: {
        user: userId,
        status: In([OrderStatus.OPEN, OrderStatus.IN_PROGRESS]),
      },
      relations: ["user", "orderItems"],
    });
  }

  /**
   * Checks if the user has an open order with items.
   * @param userId - The ID of the user.
   * @returns True if an open order with items exists; false otherwise.
   */
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

  /**
   * Closes the user's open order and transitions it to in-progress status.
   * @param userId - The ID of the user.
   * @returns The closed order.
   */
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

      // Transition the order to in-progress and calculate the total price.
      order.status = OrderStatus.IN_PROGRESS;
      order.price = order.orderItems.reduce((total, item) => total + Number(item.finalPrice), 0);

      // Calculate the expected delivery time based on preparation time.
      const maxTimeToPrepare = Math.max(...order.orderItems.map((item) => item.timeToPrepare));
      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setMinutes(expectedDeliveryDate.getMinutes() + maxTimeToPrepare);
      order.expectedDeliveryDate = expectedDeliveryDate;

      return transactionalEntityManager.save(order);
    });
  }
}
