import { WebSocketServer } from "ws";

export function initializeWebSocketServer(port: number): void {
  const wss = new WebSocketServer({ port });
  console.log(`WebSocket server started on ws://localhost:${port}`);

  wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
      console.log(`Received: ${message}`);
      ws.send(`Echo: ${message}`);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}
