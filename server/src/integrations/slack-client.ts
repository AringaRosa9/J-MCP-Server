import { WebClient } from "@slack/web-api";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

export class SlackClient {
  private client: WebClient | null = null;
  private connected = false;
  private workspaceInfo: { team?: string; user?: string } = {};

  constructor() {
    if (config.slack.botToken) {
      this.client = new WebClient(config.slack.botToken);
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
      this.workspaceInfo = { team: result.team as string, user: result.user as string };
      logger.info(`Connected to Slack workspace: ${result.team}`);
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
    const result = await client.conversations.list({
      limit,
      types: "public_channel,private_channel",
      exclude_archived: true,
    });
    return (result.channels ?? []).map((ch) => ({
      id: ch.id,
      name: ch.name,
      topic: ch.topic?.value ?? "",
      memberCount: ch.num_members ?? 0,
    }));
  }

  async searchMessages(query: string, channel?: string, count = 20) {
    const client = this.ensureClient();
    const fullQuery = channel ? `in:#${channel} ${query}` : query;
    const result = await client.search.messages({
      query: fullQuery,
      count,
      sort: "timestamp",
      sort_dir: "desc",
    });
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
    const result = await client.chat.postMessage({ channel, text });
    return {
      ok: result.ok,
      channel: result.channel,
      timestamp: result.ts,
    };
  }

  async getThreadReplies(channel: string, threadTs: string) {
    const client = this.ensureClient();
    const result = await client.conversations.replies({
      channel,
      ts: threadTs,
    });
    return (result.messages ?? []).map((msg) => ({
      user: msg.user,
      text: msg.text,
      timestamp: msg.ts,
    }));
  }
}
