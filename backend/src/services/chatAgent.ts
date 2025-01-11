import OpenAI from "openai";
import { menuData } from "../entities/menuData";
import { OrderService } from "../services/order";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

  const systemPrompt = `
You are an assistant that processes restaurant orders. Your task is to extract menu items and their quantities from a user's message.
The menu items and their details are provided below:
${JSON.stringify(menuData, null, 2)}

Output the extracted items as a JSON array with the format:
[
  {
    "name": "<item name>",
    "quantity": <quantity>,
    "description": "<item description>",
    "price": <item price>,
    "timeToPrepare": <time to prepare>
  }
]

If an item is not explicitly mentioned with a quantity, assume the quantity is 1.
If no items match, return an empty array.
`;

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
 * @returns The chatbot's reply or action result.
 */
export async function chatAgent(
  messages: Array<{ role: string; content: string }>,
  orderService: OrderService
) {
  const userId = 1; // Hardcoded userId for now
  const userMessage = messages[messages.length - 1].content;

  console.log("[DEBUG] Received user message:", userMessage);

  // Check if the user wants to finalize the order
  if (/yes|finalize|confirm/i.test(userMessage.toLowerCase())) {
    console.log("[DEBUG] User wants to finalize the order");
    await orderService.closeOrder(userId);
    return { reply: "Your order has been finalized. Thank you!" };
  }

  // Use AI to extract items from the user's message
  const extractedItems = await extractOrderItemsAI(userMessage);

  if (extractedItems.length > 0) {
    console.log("[DEBUG] Detected items for order:", extractedItems);
    await Promise.all(
      extractedItems.map((item) =>
        orderService.addOrderItem(userId, {
          name: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          finalPrice: item.price * item.quantity, // Calculate the final price
          timeToPrepare: item.timeToPrepare,
        })
      )
    );

    // Fetch active order data
    const activeOrder = await orderService.getUserActiveOrder(userId);
    if (activeOrder && activeOrder.orderItems.length > 0) {
      const orderItemsList = activeOrder.orderItems
        .map((item) => `${item.quantity} ${item.name}`)
        .join(", ");
      return { reply: `You have ${orderItemsList}. Finalize?` };
    } else {
      return { reply: "Your items have been added, but no active order was found." };
    }
  }

  // Fallback: Use OpenAI to generate a natural response
  const systemMessage = `
You are a helpful restaurant chatbot. You can process orders, finalize them, and understand menu items.
Here is the menu data you should use:
${JSON.stringify(menuData, null, 2)}

When a user mentions menu items like "Big Mac" or "Coke," place the order using the detected items.
After placing an order, fetch the active order details and ask the user to finalize.
If the user says "yes," finalize the order using the closeOrder function.
`;

  console.log("[DEBUG] Falling back to OpenAI response.");

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: systemMessage }, ...messages],
  });

  console.log("[DEBUG] OpenAI response:", response);
  return { reply: response.choices[0]?.message?.content };
}
