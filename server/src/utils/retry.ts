import { logger } from "./logger.js";

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, label = "API call" } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt === maxRetries || !isRetryable(err)) throw err;

      const delay = getDelay(err, attempt, baseDelayMs);
      logger.warn(
        `${label} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}

function isRetryable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const status =
    (err as Record<string, unknown>).status ??
    ((err as Record<string, Record<string, unknown>>).data?.status);
  if (status === 429) return true;
  if (typeof status === "number" && status >= 500 && status < 600) return true;
  return false;
}

function getDelay(
  err: unknown,
  attempt: number,
  baseDelayMs: number
): number {
  if (typeof err === "object" && err !== null) {
    const headers = (err as Record<string, Record<string, string>>).headers;
    const retryAfter = headers?.["retry-after"];
    if (retryAfter) return Number(retryAfter) * 1000;
  }
  return baseDelayMs * Math.pow(2, attempt);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
