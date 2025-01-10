import { Request, Response, NextFunction } from "express";
import { Repository } from "typeorm";
import { Order } from "../entities/order";
import { OrderItem } from "../entities/orderItem";
import { AppDataSource } from "../config/database";
import { OrderService } from "../services/order";

export const orderServiceProvider = (req: Request, res: Response, next: NextFunction) => {
  const orderRepository: Repository<Order> = AppDataSource.getRepository(Order);
  const orderItemRepository: Repository<OrderItem> = AppDataSource.getRepository(OrderItem);

  req.orderService = new OrderService(orderRepository, orderItemRepository);
  next();
};
