"use client"
import { useState } from 'react';
import { useOrders } from '../utils/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Orders() {
  const { orders, isLoading, isError } = useOrders();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  if (isLoading) return <div className="p-6">Loading orders...</div>;
  if (isError) return <div className="p-6">Error loading orders</div>;

  return (
    <div className="p-6 h-full">
      <h2 className="text-3xl font-bold mb-6">Your Orders</h2>
      <div className="space-y-6">
        {orders?.map((order) => (
          <div key={order.id} className="border border-gray-800 rounded-lg bg-gray-900/50">
            <div className="p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <h3 className="text-xl font-semibold">Order #{order.id}</h3>
                <button className="text-gray-400 hover:text-white transition-colors">
                  {expandedOrder === order.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
              </div>
              <div className="space-y-2 mt-4">
                <p className="text-gray-300">Status: {order.status}</p>
                <p className="text-gray-300">Created: {new Date(order.createdAt).toLocaleString()}</p>
                <p className="text-gray-300">Total: ${order.price}</p>
                <p className="text-gray-300">Expected Delivery: {new Date(order.expectedDeliveryDate).toLocaleString()}</p>
              </div>
              {expandedOrder === order.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h4 className="font-semibold mb-2">Order Items:</h4>
                  <ul className="space-y-2">
                    {order.orderItems.map((item) => (
                      <li key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-300">{item.name} x{item.quantity}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <p className="text-gray-300">${item.finalPrice}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}