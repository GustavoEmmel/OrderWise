import ablyClient from "@/utils/ablyClient";
import { ChatMessage, Order } from "@/types";
import { InboundMessage } from "ably";
import { useCallback, useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const BASE_API = process.env.NEXT_PUBLIC_BASE_API;

export function useChatMessages() {
  const { data, error, mutate } = useSWR<ChatMessage[]>(
    `${BASE_API}/log`,
    fetcher
  );
  return {
    messages: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useOrders() {
  const { data, error, mutate } = useSWR<Order[]>(`${BASE_API}/order`, fetcher);
  return {
    orders: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function sendChatMessage(content: string) {
  const response = await fetch(`${BASE_API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content }],
    }),
  });
  return response.json();
}

export async function updateOrderStatus(
  orderId: number,
  status: "completed" | "cancel"
) {
  const response = await fetch(`${BASE_API}/order/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status,
    }),
  });
  return response.json();
}

export function useSocketOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const { data, error, mutate } = useSWR<Order[]>(`${BASE_API}/order`, fetcher);

  // set the data coming from the initial load
  useEffect(() => {
    setOrders(data || []);
  }, [data]);

  // listen to the order channel
  useEffect(() => {
    const channel = ablyClient.channels.get("order");

    const handleMessage = (message: InboundMessage) => {
      console.log("handleMessage:", message);
      setOrders(message.data);
    };

    // Subscribe to messages
    channel.subscribe(handleMessage);

    // Cleanup on unmount
    return () => {
      channel.unsubscribe(handleMessage);
      ablyClient.channels.release("order");
    };
  }, []);

  return {
    orders,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useSWRSocket<T>(key: string, channelName: string) {
  const [items, setItems] = useState<T[]>([]);

  const { data, error, mutate } = useSWR<T[]>(`${BASE_API}${key}`, fetcher);

  useEffect(() => {
    setItems(data || []);
  }, [data]);

  useEffect(() => {
    const channel = ablyClient.channels.get(channelName);

    const handleMessage = (message: InboundMessage) => {
      setItems(message.data);
    };

    // Subscribe to messages
    channel.subscribe(handleMessage);

    // Cleanup on unmount
    return () => {
      channel.unsubscribe(handleMessage);
      ablyClient.channels.release(channelName);
    };
  }, [channelName]);

  return {
    data: items,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useRefetchOrders() {
  return useCallback(() => {
    mutate(`${BASE_API}/order`);
  }, []);
}
