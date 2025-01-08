import { OpenAI } from "openai";

export class ChatbotService {
  private ai: OpenAI;

  constructor(apiKey: string) {
    this.ai = new OpenAI({ apiKey });
  }

  async sendMessage(prompt: string): Promise<string> {
    try {
      const completion = await this.ai.completions.create({
        model: "text-davinci-003", // Use the appropriate model for your case
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
