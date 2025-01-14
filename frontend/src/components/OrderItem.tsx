"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Order } from "@/types";
import { updateOrderStatus, useRefetchOrders } from "@/utils/api";

export default function OrderItem({ order }: { order: Order }) {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const refetchOrders = useRefetchOrders();

  const handleCancel = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, "cancel");
      await refetchOrders();
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, "completed");
      await refetchOrders();
    } finally {
      setLoading(false);
    }
  };

  const cancelButton = (
    <button
      className="bg-red-800 px-4 py-2 rounded"
      disabled={loading}
      onClick={handleCancel}
    >
      Cancel
    </button>
  );

  const finalizeButton = (
    <button
      className="bg-lime-800 px-4 py-2 rounded"
      disabled={loading}
      onClick={handleComplete}
    >
      Finalize
    </button>
  );

  return (
    <div
      key={order.id}
      className="border border-gray-800 rounded-lg bg-gray-900/50"
    >
      <div className="p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() =>
            setExpandedOrder(expandedOrder === order.id ? null : order.id)
          }
        >
          <h3 className="text-xl font-semibold">Order #{order.id}</h3>
          <button className="text-gray-400 hover:text-white transition-colors">
            {expandedOrder === order.id ? (
              <ChevronUp size={24} />
            ) : (
              <ChevronDown size={24} />
            )}
          </button>
        </div>
        <div className="space-y-2 mt-4">
          <p className="text-gray-300">Status: {order.status}</p>
          <p className="text-gray-300">
            Created: {new Date(order.createdAt).toLocaleString()}
          </p>
          <p className="text-gray-300">Total: ${order.price}</p>
          <p className="text-gray-300">
            Expected Delivery:{" "}
            {(order.expectedDeliveryDate) ? new Date(order.expectedDeliveryDate).toLocaleString() : ""}
          </p>
        </div>
        {expandedOrder === order.id && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <h4 className="font-semibold mb-2">Order Items:</h4>
            <ul className="space-y-2">
              {order.orderItems.map((item) => (
                <li key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-300">
                      {item.name} x{item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <p className="text-gray-300">${item.finalPrice}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex gap-4 p-4">
        {order.status === "open" && <>{cancelButton}</>}
        {order.status === "in_progress" && (
          <>
            {cancelButton}
            {finalizeButton}
          </>
        )}
      </div>
    </div>
  );
}
