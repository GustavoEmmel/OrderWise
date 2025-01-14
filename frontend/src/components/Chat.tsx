"use client";
import { useEffect, useRef, useState } from "react";
import { useChatMessages, sendChatMessage } from "../utils/api";
import { Send, Loader2 } from "lucide-react";

export default function Chat() {
  const { messages, isLoading, isError, mutate } = useChatMessages();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      setInput("");
      await sendChatMessage(input);
      mutate();
    } finally {
      setLoading(false);
    }
  };

  // scroll to the last message added
  useEffect(() => {
    if (messages?.length) {
      const lastMessage = messages[messages?.length - 1];
      const elementId = `message-${lastMessage.id}`;
      const target = document.getElementById(elementId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [messages]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError) return <div className="p-4">Error loading messages</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-green-800/20"
      >
        {messages?.map((message) => (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={`${
              message.origin === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block max-w-[85%] px-4 py-2 rounded-lg ${
                message.origin === "user"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              <p className="text-sm">{message.prompt}</p>
              <p className="text-xs mt-1 opacity-75">
                {new Date(message.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
