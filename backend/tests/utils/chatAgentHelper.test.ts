import { describe, it, expect, vi } from "vitest";
import levenshtein from "js-levenshtein";
import {
  findMenuItem,
  generateSystemPrompt,
  hasSimilarWord,
  groupOrderItems,
} from "../../src/utils/chatAgentHelper";
import { menuData } from "../../src/entities/menuData";

vi.mock("js-levenshtein");

describe("chatAgentHelper", () => {
  describe("findMenuItem", () => {
    it("should return a menu item if it exists in the menuData", () => {
      const itemName = "Big Mac";
      const result = findMenuItem(itemName);
      expect(result).toBeDefined();
      expect(result?.name).toBe(itemName);
    });

    it("should return null if the menu item does not exist", () => {
      const itemName = "Nonexistent Item";
      const result = findMenuItem(itemName);
      expect(result).toBeNull();
    });
  });

  describe("generateSystemPrompt", () => {
    it("should generate a system prompt with the given task", () => {
      const task = "Explain the menu items.";
      const result = generateSystemPrompt(task);
      expect(result).toContain("Explain the menu items.");
      expect(result).toContain(JSON.stringify(menuData, null, 2));
    });

    it("should include the menuData in the generated prompt", () => {
      const task = "List all items.";
      const result = generateSystemPrompt(task);
      expect(result).toContain(JSON.stringify(menuData, null, 2));
    });
  });

  describe("hasSimilarWord", () => {
    it("should return true if a word similar to the target exists", () => {
      const input = "I want a refund";
      const target = "refund";
      vi.mocked(levenshtein).mockImplementationOnce(() => 1); // Mock Levenshtein distance
      const result = hasSimilarWord(input, target);
      expect(result).toBe(true);
    });

    it("should return false if no word similar to the target exists", () => {
      const input = "I want a burger";
      const target = "refund";
      vi.mocked(levenshtein).mockImplementationOnce(() => 5); // Mock Levenshtein distance
      const result = hasSimilarWord(input, target);
      expect(result).toBe(false);
    });
  });

  describe("groupOrderItems", () => {
    it("should group order items and summarize their quantities", () => {
      const orderItems = [
        { name: "Big Mac", quantity: 2 },
        { name: "Coke", quantity: 1 },
        { name: "Big Mac", quantity: 1 },
      ];
      const result = groupOrderItems(orderItems);
      expect(result).toBe("3x Big Mac, 1x Coke");
    });

    it("should return an empty string if all quantities are zero", () => {
      const orderItems = [
        { name: "Big Mac", quantity: 0 },
        { name: "Coke", quantity: 0 },
      ];
      const result = groupOrderItems(orderItems);
      expect(result).toBe("");
    });
  });
});
