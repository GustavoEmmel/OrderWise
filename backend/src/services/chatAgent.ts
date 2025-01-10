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
  const items = [];
  const lowerCaseMessage = userMessage.toLowerCase();

  for (const restaurant in menuData) {
    menuData[restaurant].items.forEach((menuItem) => {
      const itemRegex = new RegExp(`(\\d+)?\\s*${menuItem.name.toLowerCase()}`, "gi");
      const matches = lowerCaseMessage.matchAll(itemRegex);

      for (const match of matches) {
        const quantity = match[1] ? parseInt(match[1], 10) : 1; // Default quantity is 1
        items.push({ name: menuItem.name, quantity });
      }
    });
  }

  return items;
}

// Define tool functions
const tools = [
  {
    name: "place_order",
    description: "Place a new order for a user.",
    execute: async (
      params: { items: { name: string; quantity: number }[] },
      orderService: OrderService,
      userId: number
    ) => {
      const { items } = params;
      const orderItems = await Promise.all(
        items.map(async (item) => {
          const menuItem = Object.values(menuData)
            .flatMap((restaurant) => restaurant.items)
            .find((i) => i.name.toLowerCase() === item.name.toLowerCase());
          if (!menuItem) throw new Error(`Menu item ${item.name} not found.`);
          return {
            name: menuItem.name,
            unitPrice: menuItem.price,
            quantity: item.quantity,
          };
        })
      );
      await Promise.all(orderItems.map((item) => orderService.addOrderItem(userId, item)));
      return { status: "Order placed successfully." };
    },
  },
];

/**
 * Handles chatbot interactions, placing orders and managing the flow.
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

  // Attempt to extract items from the user's message
  const extractedItems = extractOrderItems(userMessage);

  if (extractedItems.length > 0) {
    // Automatically place the order if items are detected
    const tool = tools.find((tool) => tool.name === "place_order");
    if (tool) {
      const response = await tool.execute({ items: extractedItems }, orderService, userId);
      return { reply: "Your order has been placed successfully!", result: response };
    }
  }

  // Fallback: Use OpenAI to generate a natural response
  const systemMessage = `
You are a helpful restaurant chatbot. You can process orders and understand menu items.
Here is the menu data you should use:
${JSON.stringify(menuData, null, 2)}

When a user mentions menu items like "Big Mac" or "Coke," place the order using the detected items.
If you cannot detect any items, clarify with the user what they would like to order.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: systemMessage }, ...messages],
  });

  return { reply: response.choices[0]?.message?.content };
}
