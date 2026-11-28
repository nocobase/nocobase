const DEFAULT_INTERVAL_MS = 100;
const DEFAULT_REQUEST_TIMEOUT_MS = 2_000;
const DEFAULT_START_TIMEOUT_MS = 120_000;

import { setTimeout as delay } from 'node:timers/promises';

const formatError = (error) =>
  error instanceof Error ? error.message : String(error);

export const waitForHttpReady = async ({
  intervalMs = DEFAULT_INTERVAL_MS,
  isReady = (response) => response.ok,
  label,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  signal,
  timeoutMs = DEFAULT_START_TIMEOUT_MS,
  url,
}) => {
  const startedAt = Date.now();
  let lastFailure = 'the endpoint did not return a ready response';

  while (Date.now() - startedAt < timeoutMs) {
    signal?.throwIfAborted();
    try {
      const requestSignal = AbortSignal.timeout(requestTimeoutMs);
      const response = await fetch(url, {
        signal: signal
          ? AbortSignal.any([signal, requestSignal])
          : requestSignal,
      });
      const body = await response.text();

      if (await isReady(response, body)) {
        return;
      }

      lastFailure = `HTTP ${response.status}`;
    } catch (error) {
      lastFailure = formatError(error);
    }

    const remainingMs = timeoutMs - (Date.now() - startedAt);
    if (remainingMs > 0) {
      await delay(Math.min(intervalMs, remainingMs), undefined, { signal });
    }
  }

  throw new Error(
    `${label} did not become ready at ${url} within ${timeoutMs}ms: ${lastFailure}`,
  );
};
