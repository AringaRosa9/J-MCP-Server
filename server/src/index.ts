import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { initConnections } from "./integrations/index.js";
import { startApiServer } from "./api.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";

const runMode = process.argv[2];

const server = new McpServer({
  name: "j-mcp-server",
  version: "0.1.0",
});

registerAllTools(server);

async function main() {
  await initConnections();

  startApiServer(config.serverPort);

  if (runMode !== "--api-only") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("MCP stdio transport connected");
  }

  logger.info("J-MCP Server started");
}

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
