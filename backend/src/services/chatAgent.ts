import OpenAI from "openai";
import { OrderService } from "../services/order";
import { OrderStatus } from "../entities/order";
import {
  findMenuItem,
  generateSystemPrompt,
  groupOrderItems,
  hasSimilarWord,
} from "../utils/chatAgentHelper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Uses AI to interpret the user's intent from the given message.
 * @param userMessage - The user's input message.
 * @returns The interpreted intent and relevant details as structured data.
 */
async function detectIntentAI(userMessage: string): Promise<{
  intent: string;
  details: {
    action?: "add" | "remove" | "replace";
    items: Array<{
      name: string;
      quantity?: number;
      notes?: string;
      replacement?: {
        name: string;
        quantity?: number;
        description: string;
        price: number;
        timeToPrepare: number;
      };
    }>;
  };
}> {
  console.log("[DEBUG] Interpreting user intent using AI:", userMessage);

  const systemPrompt = generateSystemPrompt(`
Understand the user's intent regarding their order. Possible intents include:
- "place_order": When the user wants to add items to their order.
- "update_order": When the user wants to modify their order (add, remove, or replace items).
- "finalize_order": When the user wants to confirm and finalize their order.
- "ask_status": When the user asks about the status, progress, or details of their order.
- "refund_request": When the user requests a refund for their order.

For each intent, return a JSON object like this:
{
  "intent": "<intent>",
  "details": {
    "action": "<add|remove|replace>",
    "items": [
      {
        "name": "<item name>",
        "quantity": <quantity>,
        "notes": "<optional notes about the item>",
        "replacement": <if replacing, include new item details as { name, quantity, description, price, timeToPrepare }>
      }
    ]
  }
}
`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawDetails = JSON.parse(response.choices[0]?.message?.content || "{}");
    console.log("[DEBUG] Raw interpreted intent and details:", rawDetails);

    const items = Array.isArray(rawDetails.details?.items) ? rawDetails.details.items : [];

    const interpretation = {
      intent: rawDetails.intent || "unknown",
      details: {
        action: rawDetails.details?.action || undefined,
        items,
      },
    };
    console.log("[DEBUG] Normalized intent and details:", interpretation);
    return interpretation;
  } catch (error) {
    console.error("[ERROR] Failed to interpret intent using AI:", error);

    // Fallback for simple finalization confirmations
    if (/yes|finalize|confirm/i.test(userMessage.toLowerCase())) {
      return { intent: "finalize_order", details: { items: [] } };
    }

    return { intent: "unknown", details: { items: [] } };
  }
}

/**
 * Handles chatbot interactions, placing orders, managing active orders, modifying orders,
 * processing refunds, answering order status questions, and finalizing orders.
 * @param messages - The conversation history with user messages.
 * @param orderService - The instance of OrderService for managing orders.
 * @param userId - Optional user ID to associate the order.
 * @returns The chatbot's reply or action result.
 */
export async function chatAgent(
  messages: Array<{ role: string; content: string }>,
  orderService: OrderService,
  userId: number = 1
) {
  const userMessage = messages[messages.length - 1].content;

  console.log("[DEBUG] Received user message:", userMessage);

  // Check for a refund request using Levenshtein as fallback
  if (hasSimilarWord(userMessage, "refund")) {
    console.log("[DEBUG] Refund request detected using Levenshtein.");

    try {
      const refundedOrder = await orderService.refund(userId, userMessage);
      return {
        reply: `Your refund has been processed. Refunded amount: $${refundedOrder.refundAmount}.`,
      };
    } catch (error) {
      console.error("[ERROR] Failed to process refund:", error);
      return { reply: "Sorry, we couldn't process your refund. Please try again." };
    }
  }

  // Interpret intent using AI
  const { intent, details } = await detectIntentAI(userMessage);

  switch (intent) {
    case "place_order": {
      const items = details?.items || [];
      console.log("[DEBUG] Detected intent: place_order with items:", items);

      if (items.length === 0) {
        return { reply: "I couldn't detect any items in your order. Could you clarify?" };
      }

      for (const item of items) {
        const menuItem = findMenuItem(item.name);
        if (!menuItem) {
          console.warn(`[WARN] Menu item not found: ${item.name}`);
          continue;
        }

        await orderService.addOrderItem(userId, {
          name: menuItem.name,
          description: menuItem.description,
          unitPrice: menuItem.price,
          quantity: item.quantity || 1,
          finalPrice: menuItem.price * (item.quantity || 1),
          timeToPrepare: menuItem.timeToPrepare,
          notes: item.notes,
        });
      }

      const hasOpenOrder = await orderService.hasOpenOrderWithItems(userId);
      if (hasOpenOrder) {
        const activeOrder = await orderService.getUserActiveOrder(userId);
        const orderItemsList = activeOrder
          ?.orderItems!.map((item) => `${item.quantity}x ${item.name}`)
          .join(", ");
        return {
          reply: `You have ${orderItemsList}. Would you like to finalize the order?`,
        };
      }

      return { reply: "Your order has been placed successfully." };
    }

    case "update_order": {
      console.log("[DEBUG] Detected intent: update_order with items:", details.items);

      const activeOrder = await orderService.getUserActiveOrder(userId);
      if (!activeOrder || !activeOrder.orderItems || activeOrder.orderItems.length === 0) {
        return { reply: "You don't have an active order to update. Please place an order first." };
      }

      for (const item of details.items) {
        const menuItem = findMenuItem(item.name);
        if (!menuItem) {
          console.warn(`[WARN] Menu item not found: ${item.name}`);
          continue;
        }

        if (details.action === "remove") {
          console.log(`[DEBUG] Removing item: ${item.name}`);
          // Decrement quantity or set to 0
          const existingItem = activeOrder.orderItems.find(
            (orderItem) => orderItem.name.toLowerCase() === item.name.toLowerCase()
          );

          if (existingItem) {
            const updatedQuantity = Math.max(existingItem.quantity - (item.quantity || 1), 0);
            await orderService.modifyOrderItem(userId, item.name, {
              name: existingItem.name,
              unitPrice: existingItem.unitPrice,
              quantity: updatedQuantity,
              finalPrice: updatedQuantity * existingItem.unitPrice,
              timeToPrepare: existingItem.timeToPrepare,
            });
          } else {
            console.warn(`[WARN] Item to remove not found in the active order: ${item.name}`);
          }
        } else if (details.action === "add") {
          console.log(`[DEBUG] Adding item: ${item.name}`);
          await orderService.addOrderItem(userId, {
            name: menuItem.name,
            unitPrice: menuItem.price,
            quantity: item.quantity || 1,
            finalPrice: menuItem.price * (item.quantity || 1),
            timeToPrepare: menuItem.timeToPrepare,
            notes: item.notes,
          });
        } else if (details.action === "replace" && item.replacement) {
          console.log(`[DEBUG] Replacing item: ${item.name} with ${item.replacement.name}`);
          const replacementItem = findMenuItem(item.replacement.name);
          if (replacementItem) {
            await orderService.modifyOrderItem(userId, item.name, {
              name: replacementItem.name,
              description: item.replacement.description,
              unitPrice: replacementItem.price,
              quantity: item.replacement.quantity || 1,
              finalPrice: replacementItem.price * (item.replacement.quantity || 1),
              timeToPrepare: replacementItem.timeToPrepare,
            });
          } else {
            console.warn(`[WARN] Replacement item not found: ${item.replacement.name}`);
          }
        }
      }

      // Fetch the updated order
      const updatedOrder = await orderService.getUserActiveOrder(userId);
      if (!updatedOrder || !updatedOrder.orderItems || updatedOrder.orderItems.length === 0) {
        return {
          reply:
            "Your order has been updated, but it seems to be empty now. Please add items to continue.",
        };
      }

      // Group and list the updated order items
      const itemsList = groupOrderItems(updatedOrder.orderItems);

      return {
        reply: `Your updated order contains: ${itemsList}. Would you like to finalize the order?`,
      };
    }

    case "finalize_order": {
      console.log("[DEBUG] Detected intent: finalize_order");

      const hasOpenOrder = await orderService.hasOpenOrderWithItems(userId);
      if (!hasOpenOrder) {
        return { reply: "You don't have an open order with items. Please add items first." };
      }

      await orderService.closeOrder(userId);
      return { reply: "Your order has been finalized. Thank you!" };
    }

    case "ask_status": {
      console.log("[DEBUG] Detected intent: ask_status");

      const activeOrder = await orderService.getUserActiveOrder(userId);
      if (!activeOrder) {
        console.log("[DEBUG] No active order found.");
        return { reply: "You don't have an active order at the moment." };
      }

      const { status, expectedDeliveryDate, orderItems } = activeOrder;

      const itemsList = groupOrderItems(orderItems!);

      const itemsReply = itemsList ? `Your order contains: ${itemsList}.` : "Your order is empty.";

      switch (status) {
        case OrderStatus.OPEN:
          return {
            reply: `${itemsReply} Your order is currently open. Please finalize it to proceed.`,
          };
        case OrderStatus.IN_PROGRESS: {
          const timeLeft = expectedDeliveryDate
            ? Math.max(
                Math.ceil((new Date(expectedDeliveryDate).getTime() - Date.now()) / 60000),
                0
              )
            : "unknown";
          return {
            reply: `${itemsReply} Your order is in progress. It is expected to arrive in approximately ${timeLeft} minutes.`,
          };
        }
        case OrderStatus.COMPLETED:
          return { reply: `${itemsReply} Your order has been completed. Thank you!` };
        case OrderStatus.CANCEL:
          return { reply: `${itemsReply} Your order has been canceled.` };
        case OrderStatus.REFUNDED:
          return { reply: `${itemsReply} Your order has been refunded.` };
        default:
          return {
            reply: `${itemsReply} Your order is in an unknown state. Please contact support.`,
          };
      }
    }

    default:
      return { reply: "I'm sorry, I couldn't understand your request. Could you clarify?" };
  }
}
