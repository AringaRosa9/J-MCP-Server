import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getActivity, type UnifiedResult } from "./cross.js";

interface ReportSection {
  source: string;
  summary: string;
  items: { title: string; detail: string; url: string; time: string }[];
}

interface DailyReport {
  date: string;
  generatedAt: string;
  format: "markdown" | "json";
  sections: ReportSection[];
  stats: {
    slackMessages: number;
    notionPages: number;
    backlogIssues: number;
    total: number;
  };
  markdown?: string;
  errors: { source: string; error: string }[];
}

function buildSection(
  source: string,
  label: string,
  items: UnifiedResult[]
): ReportSection {
  return {
    source,
    summary: `${label}: ${items.length}件`,
    items: items.map((i) => ({
      title: i.title,
      detail: i.snippet,
      url: i.url,
      time: i.timestamp,
    })),
  };
}

function groupByMetadata(
  items: UnifiedResult[],
  key: string
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = String(item.metadata[key] ?? "不明");
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

function formatMarkdown(report: DailyReport): string {
  const lines: string[] = [];
  const { stats } = report;

  lines.push(`# 日報 — ${report.date}`);
  lines.push("");
  lines.push(
    `> 合計アクティビティ: **${stats.total}件**` +
      ` (Slack ${stats.slackMessages} / Notion ${stats.notionPages} / Backlog ${stats.backlogIssues})`
  );
  lines.push("");

  for (const section of report.sections) {
    lines.push(`## ${section.source}`);
    lines.push("");

    if (section.items.length === 0) {
      lines.push("_アクティビティなし_");
      lines.push("");
      continue;
    }

    lines.push(`${section.summary}`);
    lines.push("");

    for (const item of section.items) {
      const urlPart = item.url ? ` — [リンク](${item.url})` : "";
      const timePart = item.time ? formatTime(item.time) : "";
      const detailPart = item.detail ? ` — ${item.detail}` : "";
      lines.push(`- **${item.title}**${detailPart}${urlPart}`);
      if (timePart) lines.push(`  _${timePart}_`);
    }
    lines.push("");
  }

  if (report.errors.length > 0) {
    lines.push("## ⚠ エラー");
    lines.push("");
    for (const e of report.errors) {
      lines.push(`- ${e.source}: ${e.error}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push(`_生成日時: ${report.generatedAt}_`);

  return lines.join("\n");
}

function formatBacklogMarkdown(items: UnifiedResult[]): string[] {
  const lines: string[] = [];

  if (items.length === 0) return ["_アクティビティなし_", ""];

  const statusCounts = groupByMetadata(items, "status");
  const statusLine = Object.entries(statusCounts)
    .map(([k, v]) => `${k}: ${v}件`)
    .join(" / ");
  lines.push(`課題更新: ${items.length}件 (${statusLine})`);
  lines.push("");

  for (const item of items) {
    const assignee = item.metadata.assignee
      ? ` @${item.metadata.assignee}`
      : "";
    lines.push(`- **${item.title}**${assignee}`);
    if (item.snippet) lines.push(`  ${item.snippet}`);
  }

  return lines;
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      const epoch = parseFloat(ts);
      if (!isNaN(epoch)) {
        return new Date(epoch * 1000).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "";
    }
    return d.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export async function generateDailyReport(
  date?: string,
  format: "markdown" | "json" = "markdown"
): Promise<DailyReport> {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const activity = await getActivity(targetDate);

  const slackItems = activity.activity.slack?.messages ?? [];
  const notionItems = activity.activity.notion?.pages ?? [];
  const backlogItems = activity.activity.backlog?.issues ?? [];

  const sections: ReportSection[] = [];

  if (activity.activity.slack !== null) {
    const section = buildSection("Slack", "メッセージ", slackItems);
    if (slackItems.length > 0) {
      const channelCounts = groupByMetadata(slackItems, "channel");
      const channelLine = Object.entries(channelCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ch, n]) => `#${ch}(${n})`)
        .join(", ");
      section.summary = `メッセージ: ${slackItems.length}件 — 主要チャンネル: ${channelLine}`;
    }
    sections.push(section);
  }

  if (activity.activity.notion !== null) {
    sections.push(buildSection("Notion", "更新ページ", notionItems));
  }

  if (activity.activity.backlog !== null) {
    const section = buildSection("Backlog", "課題更新", backlogItems);
    if (backlogItems.length > 0) {
      const statusCounts = groupByMetadata(backlogItems, "status");
      const statusLine = Object.entries(statusCounts)
        .map(([k, v]) => `${k}: ${v}件`)
        .join(" / ");
      section.summary = `課題更新: ${backlogItems.length}件 (${statusLine})`;
    }
    sections.push(section);
  }

  const stats = {
    slackMessages: slackItems.length,
    notionPages: notionItems.length,
    backlogIssues: backlogItems.length,
    total: slackItems.length + notionItems.length + backlogItems.length,
  };

  const report: DailyReport = {
    date: targetDate,
    generatedAt: new Date().toISOString(),
    format,
    sections,
    stats,
    errors: activity.errors,
  };

  if (format === "markdown") {
    report.markdown = formatMarkdown(report);
  }

  return report;
}

export function registerReportTools(server: McpServer) {
  server.tool(
    "generate_daily_report",
    "指定日の日報を全ツールのアクティビティから自動生成する",
    {
      date: z
        .string()
        .optional()
        .describe("対象日（YYYY-MM-DD形式、省略時は今日）"),
      format: z
        .enum(["markdown", "json"])
        .optional()
        .describe("出力形式（デフォルト: markdown）"),
    },
    async ({ date, format }) => {
      const report = await generateDailyReport(date, format ?? "markdown");
      const output =
        report.format === "markdown" && report.markdown
          ? report.markdown
          : JSON.stringify(report, null, 2);
      return {
        content: [{ type: "text", text: output }],
      };
    }
  );
}
