import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSlackTools } from "./slack.js";
import { logger } from "../utils/logger.js";

export function registerAllTools(server: McpServer) {
  registerSlackTools(server);
  logger.info("All tools registered");
}
