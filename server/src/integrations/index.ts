import { SlackClient } from "./slack-client.js";
import { logger } from "../utils/logger.js";

export const slackClient = new SlackClient();

export async function initConnections() {
  if (slackClient.isConfigured()) {
    await slackClient.testConnection();
  } else {
    logger.warn("Slack not configured — set SLACK_BOT_TOKEN to enable");
  }
}
