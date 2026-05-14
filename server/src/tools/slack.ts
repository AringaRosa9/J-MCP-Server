import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { slackClient } from "../integrations/index.js";
import { getToolDef } from "./definitions.js";

export function registerSlackTools(server: McpServer) {
  const desc = (name: string) => getToolDef(name).description;

  server.tool(
    "slack_list_channels",
    desc("slack_list_channels"),
    { limit: z.number().optional().describe("取得するチャンネル数の上限") },
    async ({ limit }) => {
      const channels = await slackClient.listChannels(limit);
      return {
        content: [{ type: "text", text: JSON.stringify(channels, null, 2) }],
      };
    }
  );

  server.tool(
    "slack_search_messages",
    desc("slack_search_messages"),
    {
      query: z.string().describe("検索キーワード"),
      channel: z.string().optional().describe("検索対象のチャンネル名"),
      count: z.number().optional().describe("取得件数（デフォルト20）"),
    },
    async ({ query, channel, count }) => {
      const messages = await slackClient.searchMessages(query, channel, count);
      return {
        content: [{ type: "text", text: JSON.stringify(messages, null, 2) }],
      };
    }
  );

  server.tool(
    "slack_post_message",
    desc("slack_post_message"),
    {
      channel: z.string().describe("投稿先チャンネル名またはID"),
      text: z.string().describe("投稿するメッセージ本文"),
    },
    async ({ channel, text }) => {
      const result = await slackClient.postMessage(channel, text);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "slack_summarize_thread",
    desc("slack_summarize_thread"),
    {
      channel: z.string().describe("チャンネルID"),
      thread_ts: z.string().describe("スレッドのタイムスタンプ"),
    },
    async ({ channel, thread_ts }) => {
      const replies = await slackClient.getThreadReplies(channel, thread_ts);
      return {
        content: [{ type: "text", text: JSON.stringify(replies, null, 2) }],
      };
    }
  );
}
