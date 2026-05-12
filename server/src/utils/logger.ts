const prefix = "[j-mcp-server]";

export const logger = {
  info: (...args: unknown[]) => console.error(prefix, "INFO", ...args),
  warn: (...args: unknown[]) => console.error(prefix, "WARN", ...args),
  error: (...args: unknown[]) => console.error(prefix, "ERROR", ...args),
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG) console.error(prefix, "DEBUG", ...args);
  },
};
