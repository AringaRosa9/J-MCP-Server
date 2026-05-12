import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { slackClient } from "../integrations/index.js";

export function registerSlackTools(server: McpServer) {
  server.tool(
    "slack_list_channels",
    "Slackワークスペースのチャンネル一覧を取得する / List Slack channels",
    { limit: z.number().optional().describe("取得するチャンネル数の上限") },
    async ({ limit }) => {
      const channels = await slackClient.listChannels(limit);
      return {
        content: [
          { type: "text", text: JSON.stringify(channels, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "slack_search_messages",
    "Slackメッセージをキーワードで検索する / Search Slack messages",
    {
      query: z.string().describe("検索キーワード"),
      channel: z.string().optional().describe("検索対象のチャンネル名"),
      count: z.number().optional().describe("取得件数（デフォルト20）"),
    },
    async ({ query, channel, count }) => {
      const messages = await slackClient.searchMessages(query, channel, count);
      return {
        content: [
          { type: "text", text: JSON.stringify(messages, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "slack_post_message",
    "Slackチャンネルにメッセージを投稿する / Post a message to Slack",
    {
      channel: z.string().describe("投稿先チャンネル名またはID"),
      text: z.string().describe("投稿するメッセージ本文"),
    },
    async ({ channel, text }) => {
      const result = await slackClient.postMessage(channel, text);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "slack_summarize_thread",
    "Slackスレッドの全返信を取得する / Get all replies in a Slack thread",
    {
      channel: z.string().describe("チャンネルID"),
      thread_ts: z.string().describe("スレッドのタイムスタンプ"),
    },
    async ({ channel, thread_ts }) => {
      const replies = await slackClient.getThreadReplies(channel, thread_ts);
      return {
        content: [
          { type: "text", text: JSON.stringify(replies, null, 2) },
        ],
      };
    }
  );
}
