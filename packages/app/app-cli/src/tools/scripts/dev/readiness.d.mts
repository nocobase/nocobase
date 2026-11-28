export function waitForHttpReady(options: {
  url: string;
  label: string;
  intervalMs?: number;
  requestTimeoutMs?: number;
  timeoutMs?: number;
  redirect?: RequestRedirect;
  signal?: AbortSignal;
  isReady?: (response: Response, body: string) => boolean | Promise<boolean>;
}): Promise<void>;
