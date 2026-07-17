/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { serverRequest } from '@nocobase/utils';

import { RemoteSyncError } from '../RemoteSyncAdapter';
import { mapRemoteProviderError } from './remoteError';

export type RemoteHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RemoteHttpRequestInput {
  method: RemoteHttpMethod;
  path: string;
  credential?: string | null;
  headers?: Record<string, string>;
  data?: unknown;
  operation?: string;
}

export interface RemoteHttpResponse<T> {
  status: number;
  data: T;
  requestId?: string;
  rateLimitReset?: string | number;
}

export interface RemoteHttpRequestConfig {
  url: string;
  method: RemoteHttpMethod;
  headers: Record<string, string>;
  data?: unknown;
  timeout: number;
  maxRedirects: 0;
  maxContentLength: number;
  maxBodyLength: number;
}

export interface RemoteHttpRequesterResponse<T> {
  status: number;
  data: T;
  headers?: unknown;
}

export type RemoteHttpRequester = <T>(config: RemoteHttpRequestConfig) => Promise<RemoteHttpRequesterResponse<T>>;

export interface RemoteHttpClientOptions {
  provider: string;
  allowedOrigin: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxConcurrency?: number;
  requester?: RemoteHttpRequester;
}

const defaultRequester: RemoteHttpRequester = async <T>(config: RemoteHttpRequestConfig) => {
  const response = await serverRequest<T>(config);
  return {
    status: response.status,
    data: response.data,
    headers: response.headers,
  };
};

export class RemoteHttpClient {
  private readonly provider: string;

  private readonly allowedOrigin: string;

  private readonly timeoutMs: number;

  private readonly maxResponseBytes: number;

  private readonly maxConcurrency: number;

  private readonly requester: RemoteHttpRequester;

  private activeRequests = 0;

  private readonly waiters: Array<() => void> = [];

  constructor(options: RemoteHttpClientOptions) {
    this.provider = requireNonEmptyString(options.provider, 'provider');
    this.allowedOrigin = normalizeAllowedOrigin(options.allowedOrigin);
    this.timeoutMs = requirePositiveInteger(options.timeoutMs ?? 10_000, 'timeoutMs');
    this.maxResponseBytes = requirePositiveInteger(options.maxResponseBytes ?? 10 * 1024 * 1024, 'maxResponseBytes');
    this.maxConcurrency = requirePositiveInteger(options.maxConcurrency ?? 4, 'maxConcurrency');
    this.requester = options.requester || defaultRequester;
  }

  async request<T>(input: RemoteHttpRequestInput): Promise<RemoteHttpResponse<T>> {
    const url = this.buildUrl(input.path);
    if (input.credential && (url.includes(input.credential) || url.includes(encodeURIComponent(input.credential)))) {
      throw invalidHttpConfig('Remote credentials cannot appear in the request URL', 'credential-url-rejected');
    }
    const headers = normalizeHeaders(input.headers);
    if (input.credential) {
      headers.Authorization = `Bearer ${input.credential}`;
    }

    await this.acquire();
    try {
      const response = await this.requester<T>({
        url,
        method: input.method,
        headers,
        data: input.data,
        timeout: this.timeoutMs,
        maxRedirects: 0,
        maxContentLength: this.maxResponseBytes,
        maxBodyLength: this.maxResponseBytes,
      });

      return {
        status: response.status,
        data: response.data,
        requestId: toNonEmptyString(readHeader(response.headers, 'x-github-request-id')),
        rateLimitReset: toStringOrNumber(readHeader(response.headers, 'x-ratelimit-reset')),
      };
    } catch (error) {
      throw mapRemoteProviderError(error, {
        provider: this.provider,
        operation: input.operation,
      });
    } finally {
      this.release();
    }
  }

  buildUrl(path: string): string {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw invalidHttpConfig('Remote request path must start with "/"', 'invalid-request-path');
    }

    let url: URL;
    try {
      url = new URL(path, `${this.allowedOrigin}/`);
    } catch {
      throw invalidHttpConfig('Remote request path is invalid', 'invalid-request-path');
    }
    if (url.protocol !== 'https:' || url.origin !== this.allowedOrigin || url.username || url.password) {
      throw invalidHttpConfig('Remote request path cannot change the allowed origin', 'origin-not-allowed');
    }
    for (const key of url.searchParams.keys()) {
      if (/(token|authorization|password|secret|credential|private[\s_-]?key)/i.test(key)) {
        throw invalidHttpConfig('Remote credentials cannot appear in query parameters', 'credential-url-rejected');
      }
    }
    return url.toString();
  }

  private async acquire(): Promise<void> {
    if (this.activeRequests < this.maxConcurrency) {
      this.activeRequests += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) {
      next();
      return;
    }
    this.activeRequests -= 1;
  }
}

function normalizeAllowedOrigin(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw invalidHttpConfig('Remote provider origin is invalid', 'invalid-provider-origin');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== '/' && url.pathname !== '')
  ) {
    throw invalidHttpConfig('Remote provider origin must be an HTTPS origin', 'invalid-provider-origin');
  }
  return url.origin;
}

function normalizeHeaders(input: Record<string, string> | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(input || {})) {
    const normalizedKey = key.replace(/[^A-Za-z0-9]/g, '');
    if (
      /^(authorization|proxyauthorization|cookie|setcookie)$/i.test(normalizedKey) ||
      /(token|password|secret|credential|privatekey)/i.test(normalizedKey)
    ) {
      throw invalidHttpConfig(
        'Remote request credentials must use the credential option',
        'credential-header-rejected',
      );
    }
    headers[key] = value;
  }
  return headers;
}

function invalidHttpConfig(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('CONFIG_INVALID', message, {
    details: {
      reasonCode,
    },
  });
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidHttpConfig(`Remote HTTP ${field} must be a non-empty string`, `invalid-${field}`);
  }
  return value;
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw invalidHttpConfig(`Remote HTTP ${field} must be a positive integer`, `invalid-${field}`);
  }
  return value;
}

function readHeader(headers: unknown, name: string): unknown {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }
  const headerGetter = Reflect.get(headers, 'get');
  if (typeof headerGetter === 'function') {
    try {
      return Reflect.apply(headerGetter, headers, [name]);
    } catch {
      return undefined;
    }
  }
  const normalizedName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedName) {
      return value;
    }
  }
  return undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toStringOrNumber(value: unknown): string | number | undefined {
  if (typeof value === 'string' && value) {
    return value;
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
