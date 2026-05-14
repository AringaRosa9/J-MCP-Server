import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSlackTools } from "./slack.js";
import { registerNotionTools } from "./notion.js";
import { registerBacklogTools } from "./backlog.js";
import { logger } from "../utils/logger.js";

export function registerAllTools(server: McpServer) {
  registerSlackTools(server);
  registerNotionTools(server);
  registerBacklogTools(server);
  logger.info("All tools registered");
}
