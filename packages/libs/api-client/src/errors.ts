import type { ApiRequestMethod } from './types.js';

export interface ApiClientErrorOptions {
  readonly status: number;
  readonly payload?: unknown;
  readonly requestId?: string;
  readonly reason?: string;
  readonly domain?: string;
  readonly method: ApiRequestMethod;
  readonly url: string;
}

/**
 * A failed API request. `status` is the HTTP status; `reason` and `domain` identify the error as the server's standard
 * error body reports it, and are what code branches on. `message` is for developers and never shown to users.
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly payload: unknown;
  public readonly requestId?: string;
  public readonly reason?: string;
  public readonly domain?: string;
  public readonly method: ApiRequestMethod;
  public readonly url: string;

  public constructor(message: string, options: ApiClientErrorOptions) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.payload = options.payload;
    this.requestId = options.requestId;
    this.reason = options.reason;
    this.domain = options.domain;
    this.method = options.method;
    this.url = options.url;
  }
}
