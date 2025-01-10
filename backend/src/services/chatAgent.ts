import OpenAI from "openai";
import { menuData } from "../entities/menuData";
import { OrderService } from "../services/order";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Extracts menu items and quantities from the user's message.
 * @param userMessage - The user's input message.
 * @returns An array of items with their names and quantities.
 */
function extractOrderItems(userMessage: string) {
  console.log("[DEBUG] Extracting items from user message:", userMessage);
  const items = [];
  const lowerCaseMessage = userMessage.toLowerCase();
  const tokens = lowerCaseMessage.split(/[\s,]+and\s+|,/);

  for (const token of tokens) {
    for (const restaurant in menuData) {
      menuData[restaurant].items.forEach((menuItem) => {
        const itemRegex = new RegExp(`\\b${menuItem.name.toLowerCase()}\\b`, "gi");
        const matches = token.match(itemRegex);

        if (matches) {
          const quantityRegex = new RegExp(`(\\d+)\\s*${menuItem.name.toLowerCase()}`, "i");
          const quantityMatch = token.match(quantityRegex);
          const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
          items.push({
            name: menuItem.name,
            quantity,
            description: menuItem.description,
            price: menuItem.price,
            timeToPrepare: menuItem.timeToPrepare,
          });
        }
      });
    }
  }

  console.log("[DEBUG] Extracted items:", items);
  return items;
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
  const userMessage = messages[messages.length - 1].content.toLowerCase();

  console.log("[DEBUG] Received user message:", userMessage);

  // Check if the user wants to finalize the order
  if (/yes|finalize|confirm/i.test(userMessage)) {
    console.log("[DEBUG] User wants to finalize the order");
    await orderService.closeOrder(userId);
    return { reply: "Your order has been finalized. Thank you!" };
  }

  // Attempt to extract items from the user's message
  const extractedItems = extractOrderItems(userMessage);

  if (extractedItems.length > 0) {
    console.log("[DEBUG] Detected items for order:", extractedItems);

    for (const item of extractedItems) {
      await orderService.addOrderItem(userId, {
        name: item.name,
        description: item.description,
        unitPrice: item.price,
        quantity: item.quantity,
        finalPrice: 0, // Assuming final price is calculated in the backend
        timeToPrepare: item.timeToPrepare,
      });
    }

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
