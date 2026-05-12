import { WebClient } from "@slack/web-api";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

export class SlackClient {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(config.slack.botToken);
  }

  async testConnection() {
    const result = await this.client.auth.test();
    logger.info(`Connected to Slack workspace: ${result.team}`);
    return { ok: result.ok, team: result.team, user: result.user };
  }

  async listChannels(limit = 100) {
    const result = await this.client.conversations.list({
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
    const fullQuery = channel ? `in:#${channel} ${query}` : query;
    const result = await this.client.search.messages({
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
    const result = await this.client.chat.postMessage({ channel, text });
    return {
      ok: result.ok,
      channel: result.channel,
      timestamp: result.ts,
    };
  }

  async getThreadReplies(channel: string, threadTs: string) {
    const result = await this.client.conversations.replies({
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
