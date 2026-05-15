import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf-8")
);

interface Config {
  version: string;
  slack: {
    botToken: string | undefined;
    userToken: string | undefined;
    defaultChannel: string;
    allowedChannels: string[];
  };
  notion: {
    apiKey: string | undefined;
  };
  backlog: {
    spaceUrl: string | undefined;
    apiKey: string | undefined;
  };
  transport: "stdio";
  serverPort: number;
  apiKey: string | undefined;
}

function parseAllowedChannels(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config: Config = {
  version: pkg.version,
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    userToken: process.env.SLACK_USER_TOKEN,
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL ?? "general",
    allowedChannels: parseAllowedChannels(process.env.SLACK_ALLOWED_CHANNELS),
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY,
  },
  backlog: {
    spaceUrl: process.env.BACKLOG_SPACE_URL?.replace(/\/+$/, ""),
    apiKey: process.env.BACKLOG_API_KEY,
  },
  transport: "stdio",
  serverPort: Number(process.env.SERVER_PORT) || 3001,
  apiKey: process.env.API_KEY,
};

export function isSlackConfigured(): boolean {
  return !!config.slack.botToken;
}

export function isNotionConfigured(): boolean {
  return !!config.notion.apiKey;
}

export function isBacklogConfigured(): boolean {
  return !!config.backlog.spaceUrl && !!config.backlog.apiKey;
}
