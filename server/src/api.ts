import { createServer } from "http";
import { slackClient, notionClient } from "./integrations/index.js";
import { config, isSlackConfigured, isNotionConfigured } from "./config.js";
import { logger } from "./utils/logger.js";
import { toolDefinitions } from "./tools/definitions.js";

function json(
  res: import("http").ServerResponse,
  data: unknown,
  status = 200
) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": config.apiKey
      ? "http://localhost:3000"
      : "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function authenticate(req: import("http").IncomingMessage): boolean {
  if (!config.apiKey) return true;
  const auth = req.headers.authorization;
  if (!auth) return false;
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  return token === config.apiKey;
}

function getStatus() {
  return {
    name: "j-mcp-server",
    version: config.version,
    transport: config.transport,
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
  };
}

function getConnections() {
  return [
    {
      id: "slack",
      name: "Slack",
      description: "Slackワークスペース連携",
      configured: isSlackConfigured(),
      connected: slackClient.isConnected(),
      status: slackClient.isConnected()
        ? "connected"
        : isSlackConfigured()
          ? "disconnected"
          : "not-configured",
      workspace: slackClient.getWorkspaceInfo(),
      toolCount: toolDefinitions.filter((t) => t.integration === "slack")
        .length,
    },
    {
      id: "notion",
      name: "Notion",
      description: "Notionワークスペース連携",
      configured: isNotionConfigured(),
      connected: notionClient.isConnected(),
      status: notionClient.isConnected()
        ? "connected"
        : isNotionConfigured()
          ? "disconnected"
          : "not-configured",
      workspace: notionClient.getWorkspaceInfo(),
      toolCount: toolDefinitions.filter((t) => t.integration === "notion")
        .length,
    },
    {
      id: "backlog",
      name: "Backlog",
      description: "Backlogプロジェクト管理連携",
      configured: false,
      connected: false,
      status: "coming-soon",
      toolCount: 0,
    },
    {
      id: "obsidian",
      name: "Obsidian",
      description: "Obsidianローカルナレッジベース連携",
      configured: false,
      connected: false,
      status: "coming-soon",
      toolCount: 0,
    },
  ];
}

function getTools() {
  return toolDefinitions.map((t) => {
    let active = false;
    if (t.integration === "slack") active = slackClient.isConnected();
    if (t.integration === "notion") active = notionClient.isConnected();
    return { ...t, active };
  });
}

async function handleTestConnection(integrationId: string) {
  if (integrationId === "slack") {
    return await slackClient.testConnection();
  }
  if (integrationId === "notion") {
    return await notionClient.testConnection();
  }
  return { ok: false, error: `Unknown integration: ${integrationId}` };
}

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Internal server error";
}

export function startApiServer(port: number) {
  const server = createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      json(res, null, 204);
      return;
    }

    if (!authenticate(req)) {
      json(res, { error: "Unauthorized" }, 401);
      return;
    }

    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const path = url.pathname;

    try {
      if (req.method === "GET" && path === "/api/status") {
        json(res, getStatus());
      } else if (req.method === "GET" && path === "/api/connections") {
        json(res, getConnections());
      } else if (req.method === "GET" && path === "/api/tools") {
        json(res, getTools());
      } else if (
        req.method === "POST" &&
        path.match(/^\/api\/connections\/(\w+)\/test$/)
      ) {
        const id = path.match(/^\/api\/connections\/(\w+)\/test$/)![1];
        const result = await handleTestConnection(id);
        json(res, result);
      } else {
        json(res, { error: "Not found" }, 404);
      }
    } catch (err) {
      logger.error("API error:", err);
      json(res, { error: sanitizeError(err) }, 500);
    }
  });

  server.listen(port, () => {
    logger.info(`HTTP API listening on http://localhost:${port}`);
  });

  return server;
}
