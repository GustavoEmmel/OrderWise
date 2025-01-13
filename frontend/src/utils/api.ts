import { ChatMessage, Order } from "@/types";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useChatMessages() {
  const { data, error, mutate } = useSWR<ChatMessage[]>("http://localhost:4000/v1/log", fetcher);
  return {
    messages: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useOrders() {
  const { data, error, mutate } = useSWR<Order[]>("http://localhost:4000/v1/order", fetcher);
  return {
    orders: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export async function sendChatMessage(content: string) {
  const response = await fetch("http://localhost:4000/v1/chat", {
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
