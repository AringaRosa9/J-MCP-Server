import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  slackClient,
  notionClient,
  backlogClient,
} from "../integrations/index.js";
import { logger } from "../utils/logger.js";

export interface UnifiedResult {
  source: "slack" | "notion" | "backlog";
  type: "message" | "page" | "database" | "issue";
  title: string;
  snippet: string;
  url: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

type SourceName = "slack" | "notion" | "backlog";

const ALL_SOURCES: SourceName[] = ["slack", "notion", "backlog"];

function getConnectedSources(requested?: SourceName[]): SourceName[] {
  const candidates = requested ?? ALL_SOURCES;
  return candidates.filter((s) => {
    if (s === "slack") return slackClient.isConnected();
    if (s === "notion") return notionClient.isConnected();
    if (s === "backlog") return backlogClient.isConnected();
    return false;
  });
}

async function searchSlack(
  query: string,
  count: number
): Promise<UnifiedResult[]> {
  const messages = await slackClient.searchMessages(query, undefined, count);
  return messages.map((m) => ({
    source: "slack" as const,
    type: "message" as const,
    title: `#${m.channel ?? "unknown"}`,
    snippet: (m.text ?? "").slice(0, 200),
    url: m.permalink ?? "",
    timestamp: m.timestamp ?? "",
    metadata: { user: m.user, channel: m.channel },
  }));
}

async function searchNotion(
  query: string,
  count: number
): Promise<UnifiedResult[]> {
  const results = await notionClient.search(query, undefined, count);
  return results.map((r) => ({
    source: "notion" as const,
    type: (r.object === "database" ? "database" : "page") as
      | "page"
      | "database",
    title: r.title || "(無題)",
    snippet: "",
    url: r.url,
    timestamp: r.lastEdited,
    metadata: {},
  }));
}

async function searchBacklog(
  query: string,
  count: number
): Promise<UnifiedResult[]> {
  const issues = await backlogClient.searchIssues({
    keyword: query,
    count,
    sort: "updated",
    order: "desc",
  });
  return issues.map((i) => ({
    source: "backlog" as const,
    type: "issue" as const,
    title: `[${i.issueKey}] ${i.summary}`,
    snippet: `${i.status} / ${i.priority} / ${i.assignee ?? "未担当"}`,
    url: "",
    timestamp: i.updated,
    metadata: {
      issueKey: i.issueKey,
      status: i.status,
      priority: i.priority,
      assignee: i.assignee,
    },
  }));
}

export async function crossSearch(
  query: string,
  sources?: SourceName[],
  count = 10
): Promise<{
  results: UnifiedResult[];
  searched: SourceName[];
  skipped: SourceName[];
  errors: { source: SourceName; error: string }[];
}> {
  const requested = sources ?? ALL_SOURCES;
  const connected = getConnectedSources(sources);
  const skipped = requested.filter((s) => !connected.includes(s));

  const searchFns: Record<
    SourceName,
    (q: string, c: number) => Promise<UnifiedResult[]>
  > = {
    slack: searchSlack,
    notion: searchNotion,
    backlog: searchBacklog,
  };

  const settled = await Promise.allSettled(
    connected.map(async (src) => ({
      source: src,
      results: await searchFns[src](query, count),
    }))
  );

  const results: UnifiedResult[] = [];
  const errors: { source: SourceName; error: string }[] = [];

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value.results);
    } else {
      const reason = outcome.reason;
      const src =
        connected[settled.indexOf(outcome)] ?? ("unknown" as SourceName);
      const msg =
        reason instanceof Error ? reason.message : String(reason);
      errors.push({ source: src, error: msg });
      logger.warn(`cross_search: ${src} failed: ${msg}`);
    }
  }

  results.sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime();
    const tb = new Date(b.timestamp || 0).getTime();
    return tb - ta;
  });

  return { results, searched: connected, skipped, errors };
}

export async function getActivity(
  date?: string,
  sources?: SourceName[]
): Promise<{
  date: string;
  activity: {
    slack: { messages: UnifiedResult[]; count: number } | null;
    notion: { pages: UnifiedResult[]; count: number } | null;
    backlog: { issues: UnifiedResult[]; count: number } | null;
  };
  errors: { source: SourceName; error: string }[];
}> {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const connected = getConnectedSources(sources);
  const errors: { source: SourceName; error: string }[] = [];

  let slackActivity: { messages: UnifiedResult[]; count: number } | null =
    null;
  let notionActivity: { pages: UnifiedResult[]; count: number } | null =
    null;
  let backlogActivity: { issues: UnifiedResult[]; count: number } | null =
    null;

  const tasks: Promise<void>[] = [];

  if (connected.includes("slack")) {
    tasks.push(
      (async () => {
        try {
          const dateQuery = `after:${targetDate} before:${nextDay(targetDate)}`;
          const messages = await slackClient.searchMessages(dateQuery, undefined, 50);
          const items: UnifiedResult[] = messages.map((m) => ({
            source: "slack" as const,
            type: "message" as const,
            title: `#${m.channel ?? "unknown"}`,
            snippet: (m.text ?? "").slice(0, 200),
            url: m.permalink ?? "",
            timestamp: m.timestamp ?? "",
            metadata: { user: m.user, channel: m.channel },
          }));
          slackActivity = { messages: items, count: items.length };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ source: "slack", error: msg });
          logger.warn(`cross_get_activity: slack failed: ${msg}`);
        }
      })()
    );
  }

  if (connected.includes("notion")) {
    tasks.push(
      (async () => {
        try {
          const results = await notionClient.search("", undefined, 50);
          const dayStart = new Date(`${targetDate}T00:00:00Z`).getTime();
          const dayEnd = dayStart + 86400000;
          const filtered = results.filter((r) => {
            const t = new Date(r.lastEdited).getTime();
            return t >= dayStart && t < dayEnd;
          });
          const items: UnifiedResult[] = filtered.map((r) => ({
            source: "notion" as const,
            type: (r.object === "database" ? "database" : "page") as
              | "page"
              | "database",
            title: r.title || "(無題)",
            snippet: "",
            url: r.url,
            timestamp: r.lastEdited,
            metadata: {},
          }));
          notionActivity = { pages: items, count: items.length };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ source: "notion", error: msg });
          logger.warn(`cross_get_activity: notion failed: ${msg}`);
        }
      })()
    );
  }

  if (connected.includes("backlog")) {
    tasks.push(
      (async () => {
        try {
          const issues = await backlogClient.searchIssues({
            count: 100,
            sort: "updated",
            order: "desc",
          });
          const dayStart = new Date(`${targetDate}T00:00:00Z`).getTime();
          const dayEnd = dayStart + 86400000;
          const filtered = issues.filter((i) => {
            const t = new Date(i.updated).getTime();
            return t >= dayStart && t < dayEnd;
          });
          const items: UnifiedResult[] = filtered.map((i) => ({
            source: "backlog" as const,
            type: "issue" as const,
            title: `[${i.issueKey}] ${i.summary}`,
            snippet: `${i.status} / ${i.priority} / ${i.assignee ?? "未担当"}`,
            url: "",
            timestamp: i.updated,
            metadata: {
              issueKey: i.issueKey,
              status: i.status,
              priority: i.priority,
              assignee: i.assignee,
            },
          }));
          backlogActivity = { issues: items, count: items.length };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ source: "backlog", error: msg });
          logger.warn(`cross_get_activity: backlog failed: ${msg}`);
        }
      })()
    );
  }

  await Promise.all(tasks);

  return {
    date: targetDate,
    activity: {
      slack: slackActivity,
      notion: notionActivity,
      backlog: backlogActivity,
    },
    errors,
  };
}

function nextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function registerCrossTools(server: McpServer) {
  server.tool(
    "cross_search",
    "全ツールを横断してキーワード検索する（Slack・Notion・Backlog）",
    {
      query: z.string().describe("検索キーワード"),
      sources: z
        .array(z.enum(["slack", "notion", "backlog"]))
        .optional()
        .describe("検索対象（省略時は全ツール）"),
      count: z
        .number()
        .optional()
        .describe("各ツールからの取得件数（デフォルト10）"),
    },
    async ({ query, sources, count }) => {
      const result = await crossSearch(query, sources, count);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "cross_get_activity",
    "指定日のアクティビティを全ツールから取得する",
    {
      date: z
        .string()
        .optional()
        .describe("対象日（YYYY-MM-DD形式、省略時は今日）"),
      sources: z
        .array(z.enum(["slack", "notion", "backlog"]))
        .optional()
        .describe("取得対象（省略時は全ツール）"),
    },
    async ({ date, sources }) => {
      const result = await getActivity(date, sources);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
