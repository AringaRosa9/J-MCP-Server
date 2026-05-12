import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

interface Config {
  slack: {
    botToken: string | undefined;
    signingSecret: string | undefined;
    defaultChannel: string;
  };
  transport: "stdio";
  serverPort: number;
}

export const config: Config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL ?? "general",
  },
  transport: "stdio",
  serverPort: Number(process.env.SERVER_PORT) || 3001,
};

export function isSlackConfigured(): boolean {
  return !!config.slack.botToken && !!config.slack.signingSecret;
}
