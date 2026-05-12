import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

interface Config {
  slack: {
    botToken: string;
    signingSecret: string;
    defaultChannel: string;
  };
  transport: "stdio";
  serverPort: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  slack: {
    botToken: requireEnv("SLACK_BOT_TOKEN"),
    signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL ?? "general",
  },
  transport: "stdio",
  serverPort: Number(process.env.SERVER_PORT) || 3001,
};
