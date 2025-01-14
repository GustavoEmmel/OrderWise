import Ably from "ably";

const ablyClient = new Ably.Realtime({
  key: process.env.NEXT_PUBLIC_ABLY_KEY,
});

export default ablyClient;
