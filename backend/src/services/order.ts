import { Repository, In } from "typeorm";
import { Order, OrderStatus } from "../entities/order";
import { OrderItem } from "../entities/orderItem";
import { ensureDatabaseConnection } from "../config/database";
import { publish } from "./realtime";

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
    this.initialize();
  }

  private async initialize() {
    await ensureDatabaseConnection(); // Ensure connection is established once connection was failing in Vercel
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

      for (const itemData of orderItems) {
        // Calculate the final price of the item.
        itemData.finalPrice = itemData.unitPrice * itemData.quantity;

        const orderItem = this.orderItemRepository.create({
          ...itemData,
          order,
        });

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

      await this.sendRealTimeUpdate();

      return Array.isArray(orderItemData) ? savedOrderItems : savedOrderItems[0];
    });
  }

  async sendRealTimeUpdate() {
    const orders = await this.getAllOrders();
    await publish("order", "new-order", orders);
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
  ): Promise<OrderItem | null> {
    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const order = await this.getOrCreateOpenOrder(userId);

      if (!order.orderItems || order.orderItems.length === 0) {
        throw new Error("No items found in order to modify");
      }

      // Find the existing order item by name
      const existingItem = order.orderItems.find(
        (item) => item.name.toLowerCase() === itemName.toLowerCase()
      );

      if (!existingItem) {
        throw new Error(`Item "${itemName}" not found in the order`);
      }

      // If the new quantity is zero or less, remove the item
      if (newItemData.quantity <= 0) {
        await transactionalEntityManager.remove(existingItem);
        order.orderItems = order.orderItems.filter((item) => item.name !== itemName);
        await transactionalEntityManager.save(order);
        return null;
      }

      // Update the existing item's quantity and final price
      existingItem.name = newItemData.name;
      existingItem.description = newItemData.description;
      existingItem.quantity = newItemData.quantity;
      existingItem.unitPrice = newItemData.unitPrice;
      existingItem.finalPrice = newItemData.unitPrice * newItemData.quantity;
      existingItem.timeToPrepare = newItemData.timeToPrepare;

      // Save the updated item
      await transactionalEntityManager.save(existingItem);

      // Save the order
      await transactionalEntityManager.save(order);

      await this.sendRealTimeUpdate();

      return existingItem;
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

      const savedOrder = await transactionalEntityManager.save(Order, { id: orderId, status });

      await this.sendRealTimeUpdate();

      return savedOrder;
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

      const savedOrder = await transactionalEntityManager.save(order);

      await this.sendRealTimeUpdate();

      return savedOrder;
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

      const savedOrder = await transactionalEntityManager.save(order);
      await this.sendRealTimeUpdate();

      return savedOrder;
    });
  }

  /**
   * Fetches all orders in the system.
   * @returns All orders.
   */
  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ["user", "orderItems"],
    });
  }
}
