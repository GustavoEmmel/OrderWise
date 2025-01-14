"use client";

import { useSocketOrders } from "../utils/api";
import OrderItem from "./OrderItem";

export default function Orders() {
  const { orders, isLoading, isError } = useSocketOrders();


  if (isLoading) return <div className="p-6">Loading orders...</div>;
  if (isError) return <div className="p-6">Error loading orders</div>;

  return (
    <div className="p-6 h-full">
      <h2 className="text-3xl font-bold mb-6">Your Orders</h2>
      <div className="space-y-6">
        {orders?.map((order) => (
          <OrderItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
