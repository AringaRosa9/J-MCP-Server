import { Client, isFullPage, isFullDatabase } from "@notionhq/client";
import type {
  PageObjectResponse,
  DatabaseObjectResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

export class NotionClient {
  private client: Client | null = null;
  private connected = false;
  private workspaceInfo: { name?: string; id?: string } = {};

  constructor() {
    if (config.notion.apiKey) {
      this.client = new Client({ auth: config.notion.apiKey });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getWorkspaceInfo() {
    return this.workspaceInfo;
  }

  private ensureClient(): Client {
    if (!this.client) {
      throw new Error("Notion is not configured. Set NOTION_API_KEY in .env");
    }
    return this.client;
  }

  async testConnection() {
    try {
      const client = this.ensureClient();
      const me = await client.users.me({});
      this.connected = true;
      this.workspaceInfo = {
        name: me.name ?? undefined,
        id: me.id,
      };
      logger.info(`Connected to Notion as: ${me.name}`);
      return { ok: true, name: me.name, id: me.id };
    } catch (err) {
      this.connected = false;
      this.workspaceInfo = {};
      logger.warn("Notion connection test failed:", err);
      return { ok: false, error: String(err) };
    }
  }

  async search(query: string, filter?: "page" | "database", pageSize = 20) {
    const client = this.ensureClient();
    const result = await withRetry(
      () =>
        client.search({
          query,
          filter: filter ? { value: filter, property: "object" } : undefined,
          page_size: pageSize,
          sort: { direction: "descending", timestamp: "last_edited_time" },
        }),
      { label: "notion.search" }
    );

    return result.results
      .map((item) => {
        if (item.object === "page" && isFullPage(item)) {
          return {
            object: "page" as const,
            id: item.id,
            url: item.url,
            title: extractTitle(item.properties),
            lastEdited: item.last_edited_time,
          };
        }
        if (item.object === "database" && isFullDatabase(item)) {
          return {
            object: "database" as const,
            id: item.id,
            url: item.url,
            title: item.title.map((t) => t.plain_text).join(""),
            lastEdited: item.last_edited_time,
          };
        }
        return null;
      })
      .filter((x) => x !== null);
  }

  async listDatabases(pageSize = 20) {
    const client = this.ensureClient();
    const result = await withRetry(
      () =>
        client.search({
          filter: { value: "database", property: "object" },
          page_size: pageSize,
          sort: { direction: "descending", timestamp: "last_edited_time" },
        }),
      { label: "notion.listDatabases" }
    );

    return result.results
      .filter(isFullDatabase)
      .map((db) => ({
        id: db.id,
        title: db.title.map((t) => t.plain_text).join(""),
        url: db.url,
        lastEdited: db.last_edited_time,
      }));
  }

  async queryDatabase(
    databaseId: string,
    filter?: Record<string, unknown>,
    sorts?: Array<Record<string, unknown>>,
    pageSize = 20
  ) {
    const client = this.ensureClient();
    const result = await withRetry(
      () =>
        client.databases.query({
          database_id: databaseId,
          filter: filter as Parameters<
            typeof client.databases.query
          >[0]["filter"],
          sorts: sorts as Parameters<typeof client.databases.query>[0]["sorts"],
          page_size: pageSize,
        }),
      { label: "notion.queryDatabase" }
    );

    return result.results.filter(isFullPage).map((p) => ({
      id: p.id,
      url: p.url,
      title: extractTitle(p.properties),
      properties: simplifyProperties(p.properties),
      lastEdited: p.last_edited_time,
    }));
  }

  async getPage(pageId: string) {
    const client = this.ensureClient();

    const [page, blocks] = await Promise.all([
      withRetry(() => client.pages.retrieve({ page_id: pageId }), {
        label: "notion.getPage",
      }),
      withRetry(
        () =>
          client.blocks.children.list({ block_id: pageId, page_size: 100 }),
        { label: "notion.getPageBlocks" }
      ),
    ]);

    if (!isFullPage(page)) {
      return { id: page.id, partial: true };
    }

    return {
      id: page.id,
      url: page.url,
      title: extractTitle(page.properties),
      properties: simplifyProperties(page.properties),
      lastEdited: page.last_edited_time,
      content: blocks.results
        .filter((b): b is BlockObjectResponse => "type" in b)
        .map(simplifyBlock),
    };
  }

  async createPage(
    parentId: string,
    parentType: "database" | "page",
    properties: Record<string, unknown>,
    children?: Array<Record<string, unknown>>
  ) {
    const client = this.ensureClient();

    const parent =
      parentType === "database"
        ? { database_id: parentId }
        : { page_id: parentId };

    const result = await withRetry(
      () =>
        client.pages.create({
          parent: parent as Parameters<
            typeof client.pages.create
          >[0]["parent"],
          properties: properties as Parameters<
            typeof client.pages.create
          >[0]["properties"],
          children: children as Parameters<
            typeof client.pages.create
          >[0]["children"],
        }),
      { label: "notion.createPage" }
    );

    if (!isFullPage(result)) {
      return { id: result.id };
    }
    return {
      id: result.id,
      url: result.url,
      title: extractTitle(result.properties),
    };
  }

  async updatePage(pageId: string, properties: Record<string, unknown>) {
    const client = this.ensureClient();

    const result = await withRetry(
      () =>
        client.pages.update({
          page_id: pageId,
          properties: properties as Parameters<
            typeof client.pages.update
          >[0]["properties"],
        }),
      { label: "notion.updatePage" }
    );

    if (!isFullPage(result)) {
      return { id: result.id };
    }
    return {
      id: result.id,
      url: result.url,
      title: extractTitle(result.properties),
    };
  }
}

function extractTitle(
  properties: PageObjectResponse["properties"]
): string {
  for (const val of Object.values(properties)) {
    if (val.type === "title") {
      return val.title.map((t) => t.plain_text).join("");
    }
  }
  return "";
}

function simplifyProperties(
  properties: PageObjectResponse["properties"]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(properties)) {
    out[key] = extractPropertyValue(val);
  }
  return out;
}

function extractPropertyValue(
  prop: PageObjectResponse["properties"][string]
): unknown {
  switch (prop.type) {
    case "title":
      return prop.title.map((t) => t.plain_text).join("");
    case "rich_text":
      return prop.rich_text.map((t) => t.plain_text).join("");
    case "number":
      return prop.number;
    case "checkbox":
      return prop.checkbox;
    case "url":
      return prop.url;
    case "email":
      return prop.email;
    case "phone_number":
      return prop.phone_number;
    case "select":
      return prop.select?.name ?? null;
    case "multi_select":
      return prop.multi_select.map((s) => s.name);
    case "date":
      return prop.date?.start ?? null;
    case "status":
      return prop.status?.name ?? null;
    case "people":
      return prop.people.map((p) => ("name" in p ? p.name : p.id));
    case "relation":
      return prop.relation.map((r) => r.id);
    default:
      return null;
  }
}

function simplifyBlock(
  block: BlockObjectResponse
): Record<string, unknown> {
  const type = block.type;
  const data = (block as unknown as Record<string, Record<string, unknown>>)[
    type
  ] as Record<string, unknown> | undefined;
  const richText = data?.rich_text as
    | Array<{ plain_text: string }>
    | undefined;

  return {
    type,
    text: richText?.map((t) => t.plain_text).join("") ?? "",
    ...(data?.checked !== undefined ? { checked: data.checked } : {}),
    ...(data?.language ? { language: data.language } : {}),
  };
}
