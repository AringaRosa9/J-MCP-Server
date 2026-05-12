import { createServer } from "http";
import { slackClient } from "./integrations/index.js";
import { config, isSlackConfigured } from "./config.js";
import { logger } from "./utils/logger.js";
import { toolDefinitions } from "./tools/definitions.js";

function json(res: import("http").ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function getStatus() {
  return {
    name: "j-mcp-server",
    version: "0.1.0",
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
      toolCount: toolDefinitions.filter((t) => t.integration === "slack").length,
    },
    {
      id: "notion",
      name: "Notion",
      description: "Notionワークスペース連携",
      configured: false,
      connected: false,
      status: "coming-soon",
      toolCount: 0,
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
  const slackConnected = slackClient.isConnected();
  return toolDefinitions.map((t) => ({
    ...t,
    active: t.integration === "slack" ? slackConnected : false,
  }));
}

async function handleTestConnection(integrationId: string) {
  if (integrationId === "slack") {
    const result = await slackClient.testConnection();
    return result;
  }
  return { ok: false, error: `Unknown integration: ${integrationId}` };
}

export function startApiServer(port: number) {
  const server = createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      json(res, null, 204);
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
      } else if (req.method === "POST" && path.match(/^\/api\/connections\/(\w+)\/test$/)) {
        const id = path.match(/^\/api\/connections\/(\w+)\/test$/)![1];
        const result = await handleTestConnection(id);
        json(res, result);
      } else {
        json(res, { error: "Not found" }, 404);
      }
    } catch (err) {
      logger.error("API error:", err);
      json(res, { error: String(err) }, 500);
    }
  });

  server.listen(port, () => {
    logger.info(`HTTP API listening on http://localhost:${port}`);
  });

  return server;
}
