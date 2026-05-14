import { SlackClient } from "./slack-client.js";
import { NotionClient } from "./notion-client.js";
import { BacklogClient } from "./backlog-client.js";
import { logger } from "../utils/logger.js";

export const slackClient = new SlackClient();
export const notionClient = new NotionClient();
export const backlogClient = new BacklogClient();

export async function initConnections() {
  if (slackClient.isConfigured()) {
    await slackClient.testConnection();
  } else {
    logger.warn("Slack not configured — set SLACK_BOT_TOKEN to enable");
  }

  if (notionClient.isConfigured()) {
    await notionClient.testConnection();
  } else {
    logger.warn("Notion not configured — set NOTION_API_KEY to enable");
  }

  if (backlogClient.isConfigured()) {
    await backlogClient.testConnection();
  } else {
    logger.warn(
      "Backlog not configured — set BACKLOG_SPACE_URL and BACKLOG_API_KEY to enable"
    );
  }
}
