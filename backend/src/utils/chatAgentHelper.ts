import levenshtein from "js-levenshtein";
import { menuData } from "../entities/menuData";

/**
 * Finds a menu item by its name from menuData.
 * @param itemName - The name of the item to find.
 * @returns The menu item if found, or null if not found.
 */
export function findMenuItem(itemName: string) {
  for (const restaurant of Object.values(menuData)) {
    const item = restaurant.items.find(
      (menuItem) => menuItem.name.toLowerCase() === itemName.toLowerCase()
    );
    if (item) return item;
  }
  return null;
}

/**
 * Generates a system prompt for AI requests.
 * @param task - Description of the AI task.
 * @returns A formatted system prompt string.
 */
export function generateSystemPrompt(task: string): string {
  return `
  You are an intelligent assistant for a restaurant chatbot. Your task is: ${task}
  Below is the restaurant menu data:
  ${JSON.stringify(menuData, null, 2)}
  `;
}

/**
 * Uses Levenshtein distance to detect a word close to the target.
 * @param input - The user's input.
 * @param target - The target word.
 * @returns True if a word similar to the target is found, false otherwise.
 */
export function hasSimilarWord(input: string, target: string): boolean {
  const words = input.split(/\s+/);
  for (const word of words) {
    const distance = levenshtein(word.toLowerCase(), target.toLowerCase());
    if (distance <= 2) {
      return true;
    }
  }
  return false;
}

/**
 * Groups and summarizes order items by name.
 * @param orderItems - The order items to group.
 * @returns A record with item names as keys and their total quantities as values.
 */

export function groupOrderItems(orderItems: Array<{ name: string; quantity: number }>) {
  const groupedItems = orderItems.reduce((acc, item) => {
    if (item.quantity > 0) {
      if (!acc[item.name]) acc[item.name] = 0;
      acc[item.name] += item.quantity;
    }
    return acc;
  }, {} as Record<string, number>);

  const itemsList = Object.entries(groupedItems)
    .map(([name, quantity]) => `${quantity}x ${name}`)
    .join(", ");

  return itemsList;
}
