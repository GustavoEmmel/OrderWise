// Realtime ably api
import Ably from "ably";

export async function publish(channelName: string, event: string, data: unknown) {
  const ably = new Ably.Realtime(process.env.ABLY_API_KEY!);

  const channel = ably.channels.get(channelName);

  await channel.publish(event, data);
}
