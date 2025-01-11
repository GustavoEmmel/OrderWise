import OpenAI from "openai";
import { menuData } from "../entities/menuData";
import { OrderService } from "../services/order";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generates a system prompt for AI requests.
 * @param task - Description of the AI task.
 * @returns A formatted system prompt string.
 */
function generateSystemPrompt(task: string): string {
  return `
You are an intelligent assistant for a restaurant chatbot. Your task is: ${task}
Below is the restaurant menu data:
${JSON.stringify(menuData, null, 2)}
`;
}

/**
 * Extracts menu items and full details from the user's message using OpenAI.
 * @param userMessage - The user's input message.
 * @returns An array of items with their full details (name, quantity, description, price, timeToPrepare).
 */
async function extractOrderItemsAI(
  userMessage: string
): Promise<
  { name: string; quantity: number; description: string; price: number; timeToPrepare: number }[]
> {
  console.log("[DEBUG] Extracting items using AI for user message:", userMessage);

  const systemPrompt = generateSystemPrompt(`
Extract menu items and quantities from the user's message. Return the result as a JSON array in the format:
[
  {
    "name": "<item name>",
    "quantity": <quantity>,
    "description": "<item description>",
    "price": <item price>,
    "timeToPrepare": <time to prepare>
  }
]
If an item is not explicitly mentioned with a quantity, assume quantity = 1.
If no items match, return an empty array.
`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const extractedItems = JSON.parse(response.choices[0]?.message?.content || "[]");
    console.log("[DEBUG] Extracted items from AI:", extractedItems);
    return extractedItems;
  } catch (error) {
    console.error("[ERROR] Failed to extract items using AI:", error);
    return [];
  }
}

/**
 * Handles chatbot interactions, placing orders, managing active orders, and finalizing orders.
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

  // Check if the user wants to finalize the order
  if (/yes|finalize|confirm/i.test(userMessage.toLowerCase())) {
    console.log("[DEBUG] User wants to finalize the order");

    // Validate if the user has an open order with items
    const hasOpenOrder = await orderService.hasOpenOrderWithItems(userId);
    if (!hasOpenOrder) {
      console.log("[DEBUG] No open order with items found for the user.");
      return {
        reply: "You don't have an open order with items. Please add items to your order first.",
      };
    }

    // Finalize the order if validation passes
    try {
      await orderService.closeOrder(userId);
      return { reply: "Your order has been finalized. Thank you!" };
    } catch (error) {
      console.error("[ERROR] Failed to finalize the order:", error);
      return { reply: "Sorry, we couldn't finalize your order. Please try again." };
    }
  }

  // Use AI to extract items from the user's message
  const extractedItems = await extractOrderItemsAI(userMessage);

  if (extractedItems.length > 0) {
    console.log("[DEBUG] Detected items for order:", extractedItems);
    try {
      // Use for...of loop for sequential item creation
      for (const item of extractedItems) {
        console.log(`[DEBUG] Adding item to order: ${item.name}, quantity: ${item.quantity}`);
        await orderService.addOrderItem(userId, {
          name: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          finalPrice: item.price * item.quantity, // Calculate the final price
          timeToPrepare: item.timeToPrepare,
        });
      }

      // Fetch active order data
      const activeOrder = await orderService.getUserActiveOrder(userId);
      if (activeOrder && activeOrder.orderItems && activeOrder.orderItems.length > 0) {
        const orderItemsList = activeOrder
          .orderItems!.map((item) => `${item.quantity} ${item.name}`)
          .join(", ");
        return { reply: `You have ${orderItemsList}. Finalize?` };
      } else {
        console.warn("[WARN] Items added, but no active order found.");
        return { reply: "Your items have been added, but no active order was found." };
      }
    } catch (error) {
      console.error("[ERROR] Failed to add items to the order:", error);
      return { reply: "Sorry, we couldn't add items to your order. Please try again." };
    }
  }

  // Fallback: Use OpenAI to generate a natural response
  const fallbackPrompt = generateSystemPrompt(`
When a user mentions menu items or actions (e.g., finalize, confirm), handle their request appropriately.
If you cannot detect any items or intent, ask the user for clarification.
`);

  console.log("[DEBUG] Falling back to OpenAI response.");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: fallbackPrompt },
        { role: "user", content: userMessage },
      ],
    });

    console.log("[DEBUG] OpenAI response:", response);
    return { reply: response.choices[0]?.message?.content };
  } catch (error) {
    console.error("[ERROR] OpenAI fallback failed:", error);
    return { reply: "Sorry, I didn't understand that. Could you clarify?" };
  }
}
