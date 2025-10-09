import { WebSocket, WebSocketServer } from "ws";
import http from "http";
import { error } from "console";

export const socketsById = new Map<string, WebSocket>();

export const setupWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    let currentId = "";
    ws.on("message", (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        currentId = parsed.id;
        socketsById.set(currentId, ws);
        console.log(`WebSocket connection requested for the id ${currentId}`);
      } catch (error) {
        console.error(`Invalid websocket message:${message}`);
      }
    });

    ws.on("close", () => {
      if (currentId) {
        socketsById.delete(currentId);
        console.log(`WebSocket closed for id ${currentId}`);
      }
    });
  });
};
