import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { logger } from "./utils/logger.js";

const server = new McpServer({
  name: "j-mcp-server",
  version: "0.1.0",
});

registerAllTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("J-MCP Server started (stdio transport)");
}

main().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
