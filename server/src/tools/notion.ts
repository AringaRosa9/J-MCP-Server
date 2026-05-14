import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { notionClient } from "../integrations/index.js";
import { getToolDef } from "./definitions.js";

export function registerNotionTools(server: McpServer) {
  const desc = (name: string) => getToolDef(name).description;

  server.tool(
    "notion_search",
    desc("notion_search"),
    {
      query: z.string().describe("検索キーワード"),
      filter: z
        .enum(["page", "database"])
        .optional()
        .describe("フィルタ: page または database"),
      page_size: z.number().optional().describe("取得件数（デフォルト20）"),
    },
    async ({ query, filter, page_size }) => {
      const results = await notionClient.search(query, filter, page_size);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.tool(
    "notion_list_databases",
    desc("notion_list_databases"),
    {
      page_size: z.number().optional().describe("取得件数（デフォルト20）"),
    },
    async ({ page_size }) => {
      const databases = await notionClient.listDatabases(page_size);
      return {
        content: [{ type: "text", text: JSON.stringify(databases, null, 2) }],
      };
    }
  );

  server.tool(
    "notion_query_database",
    desc("notion_query_database"),
    {
      database_id: z.string().describe("データベースID"),
      filter: z
        .record(z.unknown())
        .optional()
        .describe("Notion APIフィルタオブジェクト"),
      sorts: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("ソート条件の配列"),
      page_size: z.number().optional().describe("取得件数（デフォルト20）"),
    },
    async ({ database_id, filter, sorts, page_size }) => {
      const pages = await notionClient.queryDatabase(
        database_id,
        filter,
        sorts,
        page_size
      );
      return {
        content: [{ type: "text", text: JSON.stringify(pages, null, 2) }],
      };
    }
  );

  server.tool(
    "notion_get_page",
    desc("notion_get_page"),
    {
      page_id: z.string().describe("ページID"),
    },
    async ({ page_id }) => {
      const page = await notionClient.getPage(page_id);
      return {
        content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
      };
    }
  );

  server.tool(
    "notion_create_page",
    desc("notion_create_page"),
    {
      parent_id: z.string().describe("親データベースまたはページのID"),
      parent_type: z
        .enum(["database", "page"])
        .describe("親の種類: database または page"),
      properties: z
        .record(z.unknown())
        .describe("ページプロパティ（Notion API形式）"),
      children: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("ページコンテンツブロック（Notion API形式）"),
    },
    async ({ parent_id, parent_type, properties, children }) => {
      const page = await notionClient.createPage(
        parent_id,
        parent_type,
        properties,
        children
      );
      return {
        content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
      };
    }
  );

  server.tool(
    "notion_update_page",
    desc("notion_update_page"),
    {
      page_id: z.string().describe("ページID"),
      properties: z
        .record(z.unknown())
        .describe("更新するプロパティ（Notion API形式）"),
    },
    async ({ page_id, properties }) => {
      const page = await notionClient.updatePage(page_id, properties);
      return {
        content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
      };
    }
  );
}
