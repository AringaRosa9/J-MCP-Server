import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSlackTools } from "./slack.js";
import { registerNotionTools } from "./notion.js";
import { registerBacklogTools } from "./backlog.js";
import { registerCrossTools } from "./cross.js";
import { registerReportTools } from "./report.js";
import { logger } from "../utils/logger.js";

export function registerAllTools(server: McpServer) {
  registerSlackTools(server);
  registerNotionTools(server);
  registerBacklogTools(server);
  registerCrossTools(server);
  registerReportTools(server);
  logger.info("All tools registered");
}
