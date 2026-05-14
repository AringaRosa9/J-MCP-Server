import { WebClient } from "@slack/web-api";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

export class SlackClient {
  private client: WebClient | null = null;
  private searchClient: WebClient | null = null;
  private connected = false;
  private workspaceInfo: { team?: string; user?: string } = {};

  constructor() {
    if (config.slack.botToken) {
      this.client = new WebClient(config.slack.botToken);
    }
    if (config.slack.userToken) {
      this.searchClient = new WebClient(config.slack.userToken);
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

  private ensureClient(): WebClient {
    if (!this.client) {
      throw new Error("Slack is not configured. Set SLACK_BOT_TOKEN in .env");
    }
    return this.client;
  }

  async testConnection() {
    try {
      const client = this.ensureClient();
      const result = await client.auth.test();
      this.connected = !!result.ok;
      this.workspaceInfo = {
        team: result.team as string,
        user: result.user as string,
      };
      logger.info(`Connected to Slack workspace: ${result.team}`);

      if (!this.searchClient) {
        logger.warn(
          "SLACK_USER_TOKEN not set — slack_search_messages will not work. " +
            "search.messages requires a User Token (xoxp-), not a Bot Token (xoxb-)."
        );
      }

      return { ok: result.ok, team: result.team, user: result.user };
    } catch (err) {
      this.connected = false;
      this.workspaceInfo = {};
      logger.warn("Slack connection test failed:", err);
      return { ok: false, error: String(err) };
    }
  }

  async listChannels(limit = 100) {
    const client = this.ensureClient();
    const allChannels: {
      id: string;
      name: string;
      topic: string;
      memberCount: number;
    }[] = [];

    let cursor: string | undefined;
    const pageSize = Math.min(limit, 200);

    do {
      const result = await withRetry(
        () =>
          client.conversations.list({
            limit: pageSize,
            types: "public_channel,private_channel",
            exclude_archived: true,
            cursor,
          }),
        { label: "conversations.list" }
      );

      for (const ch of result.channels ?? []) {
        allChannels.push({
          id: ch.id!,
          name: ch.name!,
          topic: ch.topic?.value ?? "",
          memberCount: ch.num_members ?? 0,
        });
        if (allChannels.length >= limit) break;
      }

      cursor = result.response_metadata?.next_cursor || undefined;
    } while (cursor && allChannels.length < limit);

    return allChannels;
  }

  async searchMessages(query: string, channel?: string, count = 20) {
    if (!this.searchClient) {
      throw new Error(
        "Search requires SLACK_USER_TOKEN (xoxp-). " +
          "Bot Tokens (xoxb-) do not support search.messages."
      );
    }

    const fullQuery = channel ? `in:#${channel} ${query}` : query;
    const result = await withRetry(
      () =>
        this.searchClient!.search.messages({
          query: fullQuery,
          count,
          sort: "timestamp",
          sort_dir: "desc",
        }),
      { label: "search.messages" }
    );

    return (result.messages?.matches ?? []).map((msg) => ({
      text: msg.text,
      user: msg.user,
      channel: msg.channel?.name,
      timestamp: msg.ts,
      permalink: msg.permalink,
    }));
  }

  async postMessage(channel: string, text: string) {
    const client = this.ensureClient();
    const { allowedChannels } = config.slack;

    if (allowedChannels.length > 0 && !allowedChannels.includes(channel)) {
      throw new Error(
        `Channel "${channel}" is not in SLACK_ALLOWED_CHANNELS. ` +
          `Allowed: ${allowedChannels.join(", ")}`
      );
    }

    const result = await withRetry(
      () => client.chat.postMessage({ channel, text }),
      { label: "chat.postMessage" }
    );

    return {
      ok: result.ok,
      channel: result.channel,
      timestamp: result.ts,
    };
  }

  async getThreadReplies(channel: string, threadTs: string) {
    const client = this.ensureClient();
    const result = await withRetry(
      () => client.conversations.replies({ channel, ts: threadTs }),
      { label: "conversations.replies" }
    );

    return (result.messages ?? []).map((msg) => ({
      user: msg.user,
      text: msg.text,
      timestamp: msg.ts,
    }));
  }
}
