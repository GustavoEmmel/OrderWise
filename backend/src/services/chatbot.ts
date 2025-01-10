import { OpenAI } from "openai";

export class ChatbotService {
  private ai: OpenAI;

  constructor() {
    this.ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async sendMessage(prompt: string): Promise<string> {
    try {
      const completion = await this.ai.completions.create({
        model: "gpt-3.5-turbo",
        prompt,
        max_tokens: 150,
        temperature: 0.7,
      });

      return completion.choices[0].text?.trim() || "No response received.";
    } catch (error) {
      console.error("Error communicating with OpenAI:", error);
      throw new Error("Failed to get a response from the chatbot.");
    }
  }
}
