// A small JSON client for an application server. Answers are `{ data }`; `get` and `post` return `data`. Every
// failure becomes an `ApiError` carrying the standard error body's `reason`, `NETWORK` when no response arrived, and
// `HTTP_<status>` otherwise.
import type { z } from 'zod';

import {
  ERROR_API_STATUS,
  EXIT_CODES,
  exitCodeFor,
  readErrorBody,
  type ExitCode,
} from '../protocol/index.ts';

export class ApiError extends Error {
  /** The HTTP status; 0 when no response arrived. */
  readonly status: number;
  /** The error body's `reason`, or a local one (`NETWORK`, `HTTP_<status>`). */
  readonly reason: string;
  /** The error body's canonical `status`, when it carried one. */
  readonly apiStatus: string | undefined;
  readonly metadata: unknown;

  constructor(
    status: number,
    reason: string,
    message: string,
    metadata?: unknown,
    apiStatus?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.reason = reason;
    this.metadata = metadata;
    this.apiStatus = apiStatus;
  }

  /** No response, or a server-side failure worth retrying. */
  get transient(): boolean {
    return (
      this.status === 0 ||
      this.status === 408 ||
      this.status === 429 ||
      this.status >= 500
    );
  }

  get exitCode(): ExitCode {
    // A reason of the standard error body, or one this protocol defines, decides; a bare status otherwise.
    if (this.apiStatus !== undefined || this.reason in ERROR_API_STATUS)
      return exitCodeFor(this.reason, this.apiStatus);
    if (this.status === 0) return EXIT_CODES.network;
    if (this.status === 401 || this.status === 403) return EXIT_CODES.auth;
    if (this.status === 404) return EXIT_CODES.notFound;
    if (this.status === 400) return EXIT_CODES.validation;
    if (this.status === 409) return EXIT_CODES.conflict;
    if (this.status >= 500) return EXIT_CODES.network;
    return EXIT_CODES.general;
  }
}

/** The `data` of a `{ data }` answer; anything else as it is. */
export function dataOf(body: unknown): unknown {
  return typeof body === 'object' && body !== null && 'data' in body
    ? body.data
    : body;
}

export interface ApiClientOptions {
  server: string;
  headers: Record<string, string>;
  /** Per-request timeout; long polls pass their own. */
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  query?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class ApiClient {
  private readonly options: ApiClientOptions;

  constructor(options: ApiClientOptions) {
    this.options = options;
  }

  get server(): string {
    return this.options.server;
  }

  async get<T>(
    route: string,
    schema: z.ZodType<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    return schema.parse(
      dataOf(await this.request('GET', route, undefined, options)),
    );
  }

  async post<T>(
    route: string,
    body: unknown,
    schema: z.ZodType<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    return schema.parse(
      dataOf(await this.request('POST', route, body, options)),
    );
  }

  /**
   * The bytes at `route` (a path on the server, or a URL on its origin), with this client's headers. Another origin is
   * refused, so a credential never leaves the application it belongs to.
   */
  async download(
    route: string,
    options: { timeoutMs?: number } = {},
  ): Promise<Uint8Array> {
    const base = this.options.server.endsWith('/')
      ? this.options.server
      : `${this.options.server}/`;
    const url = /^[a-z][a-z0-9+.-]*:\/\//iu.test(route)
      ? new URL(route)
      : new URL(route.replace(/^\//, ''), base);
    if (url.origin !== new URL(base).origin)
      throw new ApiError(
        0,
        'INVALID_REQUEST',
        `Refusing to download from another origin: ${url.origin}`,
      );
    let response: Response;
    try {
      response = await (this.options.fetch ?? fetch)(url, {
        headers: this.options.headers,
        signal: AbortSignal.timeout(options.timeoutMs ?? 30 * 60_000),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new ApiError(
        0,
        'NETWORK',
        `Could not reach ${url.origin}: ${reason}`,
      );
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
      const error = readErrorBody(parsed);
      if (error)
        throw new ApiError(
          response.status,
          error.reason,
          error.message,
          error.metadata,
          error.status,
        );
      throw new ApiError(
        response.status,
        `HTTP_${response.status}`,
        `GET ${url.pathname} answered ${response.status}`,
      );
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async request(
    method: string,
    route: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<unknown> {
    const url = new URL(
      route.replace(/^\//, ''),
      this.options.server.endsWith('/')
        ? this.options.server
        : `${this.options.server}/`,
    );
    for (const [key, value] of Object.entries(options.query ?? {}))
      url.searchParams.set(key, value);
    const timeout = AbortSignal.timeout(
      options.timeoutMs ?? this.options.timeoutMs ?? 30_000,
    );
    const signal =
      options.signal === undefined
        ? timeout
        : AbortSignal.any([timeout, options.signal]);
    let response: Response;
    try {
      response = await (this.options.fetch ?? fetch)(url, {
        method,
        headers: {
          accept: 'application/json',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...this.options.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new ApiError(
        0,
        'NETWORK',
        `Could not reach ${url.origin}: ${reason}`,
      );
    }
    const text = await response.text().catch(() => '');
    let parsed: unknown = undefined;
    if (text !== '') {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
    }
    if (!response.ok) {
      const error = readErrorBody(parsed);
      if (error)
        throw new ApiError(
          response.status,
          error.reason,
          error.message,
          error.metadata,
          error.status,
        );
      throw new ApiError(
        response.status,
        `HTTP_${response.status}`,
        `${method} ${url.pathname} answered ${response.status}`,
      );
    }
    return parsed;
  }
}

/** Waits `ms`, or less when `signal` aborts. Never rejects. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted === true) return resolve();
    const timer = setTimeout(done, ms);
    function done(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done, { once: true });
  });
}

/** Exponential backoff with jitter, capped. */
export function backoff(attempt: number, baseMs = 500, maxMs = 30_000): number {
  const exponential = Math.min(maxMs, baseMs * 2 ** Math.min(attempt, 16));
  return Math.round(exponential / 2 + (Math.random() * exponential) / 2);
}
