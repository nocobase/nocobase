/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import http, { IncomingMessage, ServerResponse } from 'node:http';
import https from 'node:https';
import type { Socket } from 'node:net';
import { parse } from 'node:url';
import { Gateway } from '../gateway';
import { PortalHostSupervisor } from './supervisor';

export interface PortalGatewayProxyOptions {
  targetUrl?: string;
  publicPath?: string;
}

type GatewayRequestHandler = Parameters<typeof Gateway.registerRequestHandler>[0];
type GatewayWsHandler = Parameters<typeof Gateway.registerWsHandler>[0];

const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export function registerPortalGatewayProxy(options: PortalGatewayProxyOptions = {}): (() => void) | null {
  if (process.env.PORTAL_HOST_ENABLED === 'false') {
    return null;
  }

  const supervisor = PortalHostSupervisor.getInstance({
    targetUrl: options.targetUrl,
  });
  const publicPath = normalizePublicPath(options.publicPath ?? process.env.PORTAL_PUBLIC_PATH ?? '/portals');
  const handler: GatewayRequestHandler = async (req, res) => {
    if (!isPortalRequest(req, publicPath)) {
      return false;
    }

    try {
      const lease = await supervisor.acquire();
      try {
        await proxyToPortalHost(req as IncomingMessage, res as ServerResponse, lease.targetUrl);
      } finally {
        lease.release();
      }
    } catch (error) {
      writePortalGatewayError(res as ServerResponse, error);
    }
    return true;
  };
  const wsHandler: GatewayWsHandler = async (req, socket, head) => {
    if (!isPortalRequest(req, publicPath)) {
      return false;
    }
    if (isPortalWebSocketRequest(req, publicPath)) {
      return false;
    }

    try {
      const lease = await supervisor.acquire();
      proxyWebSocketToPortalHost(req, socket as Socket, head, lease.targetUrl, lease.release);
    } catch (error) {
      writePortalGatewaySocketError(socket as Socket, error);
    }
    return true;
  };

  Gateway.registerRequestHandler(handler);
  Gateway.registerWsHandler(wsHandler);
  return () => {
    Gateway.unregisterRequestHandler(handler);
    Gateway.unregisterWsHandler(wsHandler);
  };
}

function isPortalRequest(req: { url?: string }, publicPath: string): boolean {
  const pathname = parse(req.url ?? '/').pathname ?? '/';
  return (
    pathname === publicPath || pathname.startsWith(`${publicPath}/`) || /^\/apps\/[^/]+\/portals(?:\/|$)/.test(pathname)
  );
}

function isPortalWebSocketRequest(req: { url?: string }, publicPath: string): boolean {
  const pathname = parse(req.url ?? '/').pathname ?? '/';
  const escapedPublicPath = publicPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`^${escapedPublicPath}/[^/]+/ws$`).test(pathname) || /^\/apps\/[^/]+\/portals\/[^/]+\/ws$/.test(pathname)
  );
}

function proxyToPortalHost(req: IncomingMessage, res: ServerResponse, target: URL): Promise<void> {
  return new Promise((resolve) => {
    const requestUrl = new URL(req.url ?? '/', target);
    requestUrl.protocol = target.protocol;
    requestUrl.host = target.host;

    const headers = filterRequestHeaders(req.headers);
    headers.host = target.host;
    headers['x-forwarded-host'] = req.headers.host ?? '';
    headers['x-forwarded-proto'] = forwardedProto(req);

    const transport = requestUrl.protocol === 'https:' ? https : http;
    const proxyReq = transport.request(
      requestUrl,
      {
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.statusCode = proxyRes.statusCode ?? 502;
        res.statusMessage = proxyRes.statusMessage ?? res.statusMessage;
        for (const [name, value] of Object.entries(proxyRes.headers)) {
          if (value !== undefined && !hopByHopHeaders.has(name.toLowerCase())) {
            res.setHeader(name, value);
          }
        }

        proxyRes.pipe(res);
        proxyRes.once('end', resolve);
      },
    );

    proxyReq.once('error', (error) => {
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('content-type', 'application/json');
      }

      res.end(
        JSON.stringify({
          error: 'Portal host unavailable',
          message: error.message,
        }),
      );
      resolve();
    });

    req.pipe(proxyReq);
  });
}

function proxyWebSocketToPortalHost(
  req: IncomingMessage,
  socket: Socket,
  head: Buffer,
  target: URL,
  release: () => void,
): void {
  const requestUrl = new URL(req.url ?? '/', target);
  requestUrl.protocol = target.protocol;
  requestUrl.host = target.host;

  const headers = filterRequestHeaders(req.headers);
  headers.host = target.host;
  headers.connection = 'Upgrade';
  headers.upgrade = req.headers.upgrade ?? 'websocket';
  headers['x-forwarded-host'] = req.headers.host ?? '';
  headers['x-forwarded-proto'] = forwardedProto(req);

  let released = false;
  const releaseOnce = () => {
    if (released) {
      return;
    }

    released = true;
    release();
  };

  socket.once('close', releaseOnce);
  socket.once('error', releaseOnce);

  const transport = requestUrl.protocol === 'https:' ? https : http;
  const proxyReq = transport.request(requestUrl, {
    method: req.method,
    headers,
  });

  proxyReq.once('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(formatUpgradeResponse(proxyRes));
    if (proxyHead.length > 0) {
      socket.write(proxyHead);
    }
    if (head.length > 0) {
      proxySocket.write(head);
    }

    proxySocket.once('close', releaseOnce);
    proxySocket.once('error', releaseOnce);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.once('response', (proxyRes) => {
    socket.write(`HTTP/1.1 ${proxyRes.statusCode ?? 502} ${proxyRes.statusMessage ?? 'Bad Gateway'}\r\n\r\n`);
    socket.destroy();
    releaseOnce();
  });

  proxyReq.once('error', (error) => {
    writePortalGatewaySocketError(socket, error);
    releaseOnce();
  });

  proxyReq.end();
}

function filterRequestHeaders(headers: IncomingMessage['headers']): Record<string, string | string[]> {
  const nextHeaders: Record<string, string | string[]> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || hopByHopHeaders.has(name.toLowerCase())) {
      continue;
    }

    nextHeaders[name] = value;
  }

  return nextHeaders;
}

function forwardedProto(req: IncomingMessage): string {
  const value = req.headers['x-forwarded-proto'];
  if (Array.isArray(value)) {
    return value[0] ?? 'http';
  }

  return value ?? 'http';
}

function normalizePublicPath(path: string): string {
  const normalized = `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/portals';
}

function writePortalGatewayError(res: ServerResponse, error: unknown): void {
  if (!res.headersSent) {
    res.statusCode = error instanceof Error && error.message.includes('timed out') ? 504 : 503;
    res.setHeader('content-type', 'application/json');
  }

  res.end(
    JSON.stringify({
      error: 'Portal host unavailable',
      message: error instanceof Error ? error.message : String(error),
    }),
  );
}

function writePortalGatewaySocketError(socket: Socket, error: unknown): void {
  if (!socket.destroyed) {
    const message = error instanceof Error ? error.message : String(error);
    socket.write(
      [
        'HTTP/1.1 503 Service Unavailable',
        'content-type: application/json',
        'connection: close',
        '',
        JSON.stringify({
          error: 'Portal host unavailable',
          message,
        }),
      ].join('\r\n'),
    );
  }

  socket.destroy();
}

function formatUpgradeResponse(res: IncomingMessage): string {
  const lines = [`HTTP/1.1 ${res.statusCode ?? 101} ${res.statusMessage ?? 'Switching Protocols'}`];
  for (let index = 0; index < res.rawHeaders.length; index += 2) {
    const name = res.rawHeaders[index];
    const value = res.rawHeaders[index + 1];
    if (name && value) {
      lines.push(`${name}: ${value}`);
    }
  }

  lines.push('', '');
  return lines.join('\r\n');
}
