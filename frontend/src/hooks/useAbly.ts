import { useEffect, useState } from "react";
import ablyClient from "../utils/ablyClient";

export const useAbly = (channelName: string) => {
  const [messages, setMessages] = useState<unknown[]>([]);

  useEffect(() => {
    const channel = ablyClient.channels.get(channelName);

    const handleMessage = (message: unknown) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    // Subscribe to messages
    channel.subscribe(handleMessage);

    // Cleanup on unmount
    return () => {
      channel.unsubscribe(handleMessage);
      ablyClient.channels.release(channelName);
    };
  }, [channelName]);

  const publishMessage = (message: unknown) => {
    const channel = ablyClient.channels.get(channelName);
    channel.publish("event", message);
  };

  return { messages, publishMessage };
};
