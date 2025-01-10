import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mock, instance, reset, when, deepEqual, anything } from "ts-mockito";
import { OrderService } from "../../src/services/order";
import { Order, OrderStatus } from "../../src/entities/order";
import { OrderItem } from "../../src/entities/orderItem";
import { Repository, EntityManager, In } from "typeorm";

describe("OrderService", () => {
  let mockOrderRepository: Repository<Order>;
  let mockOrderItemRepository: Repository<OrderItem>;
  let mockEntityManager: EntityManager;
  let orderService: OrderService;

  beforeEach(() => {
    // Mock repositories and entity manager
    mockOrderRepository = mock<Repository<Order>>();
    mockOrderItemRepository = mock<Repository<OrderItem>>();
    mockEntityManager = mock<EntityManager>();

    // Mock the transaction method on the entity manager
    when(mockEntityManager.transaction(anything())).thenCall(async (fn) => {
      return fn(instance(mockEntityManager));
    });

    // Initialize the service with mocked repositories and entity manager
    orderService = new OrderService(
      instance(mockOrderRepository),
      instance(mockOrderItemRepository)
    );

    // Override the manager property to use the mocked entity manager
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (orderService as any).orderRepository.manager = instance(mockEntityManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    reset(mockOrderRepository);
    reset(mockOrderItemRepository);
    reset(mockEntityManager);
  });

  it("should return existing order", async () => {
    const existingOrder = { id: 1, status: OrderStatus.OPEN, user: 1 } as Order;
    when(
      mockOrderRepository.findOne(
        deepEqual({
          where: { user: 1, status: In([OrderStatus.OPEN, OrderStatus.IN_PROGRESS]) },
          relations: ["user", "orderItems"],
        })
      )
    ).thenResolve(existingOrder);

    const order = await orderService.getUserActiveOrder(1);
    console.log("order", order);

    expect(order).toEqual(existingOrder);
  });

  it("should create a new order if no open order exists", async () => {
    when(
      mockOrderRepository.findOne(
        deepEqual({
          where: { user: 1, status: In([OrderStatus.OPEN, OrderStatus.IN_PROGRESS]) },
          relations: ["user", "orderItems"],
        })
      )
    ).thenResolve(null);
    when(mockOrderRepository.create(anything())).thenReturn([
      {
        id: 1,
        user: 1,
        status: OrderStatus.OPEN,
      },
    ] as Order[]);
    when(mockEntityManager.save(anything())).thenResolve({
      id: 1,
      user: 1,
      status: OrderStatus.OPEN,
    } as Order);

    const order = await orderService.getOrCreateOpenOrder(1);

    expect(order).toBeDefined();
    expect(order.status).toBe(OrderStatus.OPEN);
    expect(order.user).toBe(1);
  });

  it("should add an order item to an order", async () => {
    const order = { id: 1, status: OrderStatus.OPEN, user: 1, orderItems: [] } as unknown as Order;
    const orderItemData = {
      name: "Test Item",
      description: "Test Description",
      quantity: 1,
      unitPrice: 10,
      finalPrice: 10,
      timeToPrepare: 5,
    };

    when(
      mockOrderRepository.findOne(
        deepEqual({
          where: { user: 1, status: OrderStatus.OPEN },
          relations: ["orderItems"],
        })
      )
    ).thenResolve(order);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    when(mockOrderItemRepository.create(anything())).thenReturn(orderItemData as OrderItem as any);
    when(mockEntityManager.save(anything())).thenResolve(orderItemData as OrderItem);
    when(mockEntityManager.save(anything())).thenResolve(order);

    const orderItem = await orderService.addOrderItem(1, orderItemData);

    expect(orderItem).toBeDefined();
    expect(orderItem.name).toBe(orderItemData.name);
  });

  it("should modify an existing order item", async () => {
    const order = {
      id: 1,
      status: OrderStatus.OPEN,
      user: 1,
      orderItems: [{ id: 1, name: "Test Item", finalPrice: 10 } as OrderItem],
    } as Order;
    const newItemData = {
      name: "New Item",
      description: "New Description",
      quantity: 2,
      unitPrice: 15,
      finalPrice: 30,
      timeToPrepare: 10,
    };

    when(
      mockOrderRepository.findOne(
        deepEqual({
          where: { user: 1, status: OrderStatus.OPEN },
          relations: ["orderItems"],
        })
      )
    ).thenResolve(order);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    when(mockOrderItemRepository.create(anything())).thenReturn(newItemData as OrderItem as any);
    when(mockEntityManager.save(anything())).thenResolve(newItemData as OrderItem);
    when(mockEntityManager.save(anything())).thenResolve(order);

    const modifiedOrder = (await orderService.modifyOrderItem(
      1,
      "Test Item",
      newItemData
    )) as unknown as Order;

    expect(modifiedOrder).toBeDefined();
    expect(modifiedOrder.orderItems![0].name).toBe(newItemData.name);
  });

  it("should update order status", async () => {
    const order = { id: 1, status: OrderStatus.OPEN, user: 1 } as Order;

    when(mockEntityManager.save(Order, anything())).thenResolve({
      ...order,
      status: OrderStatus.COMPLETED,
    });

    const updatedOrder = await orderService.updateOrderStatus(1, OrderStatus.COMPLETED);

    expect(updatedOrder).toBeDefined();
    expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);
  });

  it("should refund an order", async () => {
    const order = { id: 1, status: OrderStatus.COMPLETED, user: 1, price: 100 } as Order;

    when(mockEntityManager.findOne(Order, anything())).thenResolve(order);
    when(mockEntityManager.save(anything())).thenResolve({
      ...order,
      status: OrderStatus.REFUNDED,
      refundAmount: 100,
    });

    const refundedOrder = await orderService.refund(1);
    expect(refundedOrder).toBeDefined();
    expect(refundedOrder.status).toBe(OrderStatus.REFUNDED);
    expect(refundedOrder.refundAmount).toBe(100);
  });

  it("should check if user has open order with items", async () => {
    const order = {
      id: 1,
      status: OrderStatus.OPEN,
      user: 1,
      orderItems: [{ id: 1, name: "Test Item" } as OrderItem],
    } as Order;

    when(
      mockOrderRepository.findOne(
        deepEqual({
          where: { user: 1, status: OrderStatus.OPEN },
          relations: ["orderItems"],
        })
      )
    ).thenResolve(order);

    const hasOpenOrderWithItems = await orderService.hasOpenOrderWithItems(1);
    expect(hasOpenOrderWithItems).toBe(true);
  });

  it("should close an order", async () => {
    const order = {
      id: 1,
      status: OrderStatus.OPEN,
      user: 1,
      orderItems: [{ id: 1, name: "Test Item", finalPrice: 10, timeToPrepare: 5 } as OrderItem],
    } as Order;

    when(
      mockEntityManager.findOne(
        Order,
        deepEqual({
          where: { user: 1, status: OrderStatus.OPEN },
          relations: ["orderItems"],
        })
      )
    ).thenResolve(order);
    when(mockEntityManager.save(anything())).thenResolve({
      ...order,
      status: OrderStatus.IN_PROGRESS,
      price: 10,
      expectedDeliveryDate: new Date(),
    });

    const closedOrder = await orderService.closeOrder(1);

    expect(closedOrder).toBeDefined();
    expect(closedOrder.status).toBe(OrderStatus.IN_PROGRESS);
    expect(closedOrder.price).toBe(10);
    expect(closedOrder.expectedDeliveryDate).toBeInstanceOf(Date);
  });

  it("should throw an error if no open order found to close", async () => {
    when(
      mockOrderRepository.findOne(
        deepEqual({
          where: { user: 1, status: OrderStatus.OPEN },
          relations: ["orderItems"],
        })
      )
    ).thenResolve(null);

    await expect(orderService.closeOrder(1)).rejects.toThrow("No open order found to close");
  });

  it("should throw an error if no order found to refund", async () => {
    when(
      mockOrderRepository.findOne(
        deepEqual({
          where: { user: 1, status: In([OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED]) },
          order: { createdAt: "DESC" },
        })
      )
    ).thenResolve(null);

    await expect(orderService.refund(1)).rejects.toThrow("No order found to refund");
  });

  it("should throw an error if order is already refunded", async () => {
    const order = { id: 1, status: OrderStatus.REFUNDED, user: 1, price: 100 } as Order;

    when(
      mockEntityManager.findOne(
        Order,
        deepEqual({
          where: { user: 1, status: In([OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED]) },
          order: { createdAt: "DESC" },
        })
      )
    ).thenResolve(order);

    await expect(orderService.refund(1)).rejects.toThrow("Order is already refunded");
  });
});
