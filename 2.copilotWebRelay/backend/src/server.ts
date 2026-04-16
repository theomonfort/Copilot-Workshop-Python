import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

interface ClientMessage {
  type: "chat";
  content: string;
}

wss.on("connection", (ws: WebSocket) => {
  console.log("WebSocket client connected");

  let client: CopilotClient | null = null;
  let session: Awaited<ReturnType<CopilotClient["createSession"]>> | null = null;
  let isProcessing = false;
  let isClosing = false;
  const messageQueue: string[] = [];
  let initPromise: Promise<void> | null = null;

  async function initialize(): Promise<void> {
    client = new CopilotClient();
    await client.start();
    console.log("CopilotClient started");
  }

  async function ensureSession(): Promise<NonNullable<typeof session>> {
    if (session) return session;
    if (!client) throw new Error("Client not initialized");

    session = await client.createSession({
      model: "gpt-4.1",
      onPermissionRequest: approveAll,
    });

    session.on("assistant.message_delta", (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "delta", content: event.data.deltaContent }));
      }
    });

    session.on("session.idle", () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "done" }));
      }
      isProcessing = false;
      processQueue();
    });

    return session;
  }

  async function processQueue(): Promise<void> {
    if (isProcessing || messageQueue.length === 0) return;

    isProcessing = true;
    const content = messageQueue.shift()!;

    try {
      const s = await ensureSession();
      await s.send({ prompt: content });
    } catch (err) {
      console.error("Error processing message:", err);
      isProcessing = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "error",
            content: err instanceof Error ? err.message : "Unknown error",
          })
        );
      }
      processQueue();
    }
  }

  // Initialize the client when connection is established
  initPromise = initialize().catch((err) => {
    console.error("Failed to initialize CopilotClient:", err);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "error",
          content: "Failed to initialize Copilot client",
        })
      );
    }
  });

  ws.on("message", (data: Buffer) => {
    if (isClosing) return;
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      if (message.type !== "chat" || typeof message.content !== "string") {
        ws.send(JSON.stringify({ type: "error", content: "Invalid message format" }));
        return;
      }

      messageQueue.push(message.content);
      processQueue();
    } catch (err) {
      console.error("Error parsing message:", err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "error", content: "Invalid JSON" }));
      }
    }
  });

  ws.on("close", async () => {
    console.log("WebSocket client disconnected");
    isClosing = true;
    // Wait for initialization to complete before cleaning up
    if (initPromise) {
      await initPromise.catch(() => {});
    }
    try {
      if (session) await session.disconnect();
    } catch (err) {
      console.error("Error disconnecting session:", err);
    }
    try {
      if (client) await client.stop();
    } catch (err) {
      console.error("Error stopping client:", err);
    }
    session = null;
    client = null;
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
