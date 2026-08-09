/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

interface PortalRequestTarget {
  basePath: string;
  signal: AbortSignal;
}

interface RequestInitWithDuplex extends RequestInit {
  duplex?: 'half';
}

export function toFetchRequest(req: IncomingMessage, runtime: PortalRequestTarget): Request {
  const url = requestUrl(req);
  const pathInsidePortal = url.pathname.slice(runtime.basePath.length) || '/';
  url.pathname = pathInsidePortal.startsWith('/') ? pathInsidePortal : `/${pathInsidePortal}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    if (value !== undefined) {
      headers.set(key, value);
    }
  }

  const method = req.method ?? 'GET';
  const init: RequestInitWithDuplex = {
    method,
    headers,
    signal: combineAbortSignals(runtime.signal, requestAbortSignal(req)),
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = Readable.toWeb(req) as unknown as BodyInit;
    init.duplex = 'half';
  }

  return new Request(url, init);
}

export async function applyFetchResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;

  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies = headersWithSetCookie.getSetCookie?.() ?? [];

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      res.setHeader(key, value);
    }
  });

  if (setCookies.length > 0) {
    res.setHeader('set-cookie', setCookies);
  }

  if (!response.body) {
    res.end();
    return;
  }

  await pipeline(Readable.fromWeb(response.body as unknown as import('node:stream/web').ReadableStream), res);
}

export function requestPath(req: IncomingMessage): string {
  return requestUrl(req).pathname;
}

function requestUrl(req: IncomingMessage): URL {
  const host = req.headers.host ?? 'localhost';
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] ?? 'http' : forwardedProto ?? 'http';

  return new URL(req.url ?? '/', `${protocol}://${host}`);
}

function requestAbortSignal(req: IncomingMessage): AbortSignal {
  const controller = new AbortController();

  req.once('aborted', () => controller.abort(new Error('client request aborted')));
  req.once('close', () => {
    if (!req.complete) {
      controller.abort(new Error('client connection closed before request completed'));
    }
  });

  return controller.signal;
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }

  return controller.signal;
}
