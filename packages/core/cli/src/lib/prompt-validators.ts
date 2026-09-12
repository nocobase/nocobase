/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';
import net from 'node:net';
import type { PromptValue } from './prompt-catalog.ts';
import { translateCli } from './cli-locale.ts';

const API_BASE_URL_EXAMPLE = 'http://localhost:13000/api';
const ENV_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;
const APP_PUBLIC_PATH_PATTERN = /^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)?\/?$/;
const TCP_PORT_EXAMPLE = '13000';
const API_BASE_URL_REQUEST_TIMEOUT_MS = 5_000;
const TCP_PORT_PROBE_HOSTS = ['127.0.0.1', '0.0.0.0', '::1'] as const;

function buildHealthCheckUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/__health_check`;
}

function hasSupportedApiBasePath(pathname: string): boolean {
  return /\/api(?:\/__app\/[^/]+)?\/?$/.test(pathname);
}

function isMaintainingHealthCheckResponse(status: number, body: unknown): boolean {
  if (status !== 503 || !body || typeof body !== 'object') {
    return false;
  }

  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as {
    status?: unknown;
    maintaining?: unknown;
    code?: unknown;
  };

  return record.status === 503 && record.maintaining === true && record.code === 'APP_COMMANDING';
}

export async function validateApiBaseUrl(value: PromptValue): Promise<string | undefined> {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return translateCli('validators.apiBaseUrl.invalid', { example: API_BASE_URL_EXAMPLE });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return translateCli('validators.apiBaseUrl.invalidProtocol', { example: API_BASE_URL_EXAMPLE });
  }

  if (/\/__health_check\/?$/i.test(url.pathname)) {
    return translateCli('validators.apiBaseUrl.healthCheckPathNotAllowed');
  }

  if (!hasSupportedApiBasePath(url.pathname)) {
    return translateCli('validators.apiBaseUrl.missingApiPrefix', { example: API_BASE_URL_EXAMPLE });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, API_BASE_URL_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildHealthCheckUrl(url.toString()), {
      method: 'GET',
      signal: controller.signal,
    });

    if (response.status === 200) {
      return undefined;
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    if (isMaintainingHealthCheckResponse(response.status, body)) {
      return translateCli('validators.apiBaseUrl.maintaining');
    }

    return translateCli('validators.apiBaseUrl.healthCheckFailed', { status: response.status });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return translateCli('validators.apiBaseUrl.timeout', {
        seconds: Math.ceil(API_BASE_URL_REQUEST_TIMEOUT_MS / 1000),
      });
    }

    return translateCli('validators.apiBaseUrl.unreachable', {
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeout);
  }

  return undefined;
}

export function validateEnvKey(value: PromptValue): string | undefined {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    return undefined;
  }

  if (!ENV_KEY_PATTERN.test(raw)) {
    return translateCli('validators.envKey.invalid');
  }

  return undefined;
}

export function validateAppPublicPath(value: PromptValue): string | undefined {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    return undefined;
  }

  if (!raw.startsWith('/')) {
    return translateCli('validators.appPublicPath.invalid');
  }

  if (!APP_PUBLIC_PATH_PATTERN.test(raw)) {
    return translateCli('validators.appPublicPath.invalid');
  }

  return undefined;
}

function parseTcpPort(value: PromptValue): number | undefined {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    return undefined;
  }
  if (!/^\d+$/.test(raw)) {
    return undefined;
  }

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return undefined;
  }

  return port;
}

export function validateTcpPort(value: PromptValue): string | undefined {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    return undefined;
  }

  const port = parseTcpPort(raw);
  if (port === undefined) {
    return translateCli('validators.tcpPort.invalid', { example: TCP_PORT_EXAMPLE });
  }

  return undefined;
}

async function canListenOnTcpPortHost(
  port: number,
  host: (typeof TCP_PORT_PROBE_HOSTS)[number],
): Promise<boolean | undefined> {
  return await new Promise<boolean | undefined>((resolve) => {
    const server = net.createServer();

    const resolveAndCleanup = (result: boolean | undefined) => {
      server.removeAllListeners();
      if (server.listening) {
        server.close(() => resolve(result));
      } else {
        resolve(result);
      }
    };

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRNOTAVAIL' || error.code === 'EAFNOSUPPORT') {
        resolveAndCleanup(undefined);
        return;
      }
      resolveAndCleanup(false);
    });

    server.once('listening', () => {
      resolveAndCleanup(true);
    });

    server.listen(port, host);
  });
}

async function canListenOnTcpPort(port: number): Promise<boolean> {
  for (const host of TCP_PORT_PROBE_HOSTS) {
    const result = await canListenOnTcpPortHost(port, host);
    if (result === false) {
      return false;
    }
  }

  return true;
}

function parseDockerPublishedTcpPorts(output: string): Set<number> {
  const ports = new Set<number>();

  for (const line of output.split(/\r?\n/)) {
    for (const segment of line.split(',')) {
      const match = segment.trim().match(/^(?:.+:)?(\d+)->\d+(?:-\d+)?\/tcp$/i);
      if (!match) {
        continue;
      }
      const port = Number.parseInt(match[1], 10);
      if (Number.isInteger(port) && port >= 1 && port <= 65535) {
        ports.add(port);
      }
    }
  }

  return ports;
}

async function getDockerPublishedTcpPorts(): Promise<Set<number>> {
  return await new Promise<Set<number>>((resolve) => {
    let settled = false;
    const stdoutChunks: Buffer[] = [];
    const finish = (ports: Set<number>) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(ports);
    };

    const child = spawn('docker', ['ps', '--format', '{{.Ports}}']);

    child.stdout?.on('data', (chunk) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });

    child.once('error', () => {
      finish(new Set());
    });

    child.once('close', (code) => {
      if (code !== 0) {
        finish(new Set());
        return;
      }

      finish(parseDockerPublishedTcpPorts(Buffer.concat(stdoutChunks).toString('utf8')));
    });
  });
}

async function allocateAvailableTcpPort(): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const server = net.createServer();

    server.once('error', reject);

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port =
        address && typeof address === 'object'
          ? address.port
          : undefined;

      if (!port) {
        server.close(() => {
          reject(new Error(translateCli('validators.tcpPort.allocateFailed')));
        });
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(String(port));
      });
    });
  });
}

export async function findAvailableTcpPort(): Promise<string> {
  const dockerPorts = await getDockerPublishedTcpPorts();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = await allocateAvailableTcpPort();
    const port = Number.parseInt(candidate, 10);
    if (!dockerPorts.has(port) && (await canListenOnTcpPort(port))) {
      return candidate;
    }
  }

  throw new Error(translateCli('validators.tcpPort.allocateNotDockerPublished'));
}

export async function validateAvailableTcpPort(value: PromptValue): Promise<string | undefined> {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    return undefined;
  }

  const formatError = validateTcpPort(raw);
  if (formatError) {
    return formatError;
  }
  const port = parseTcpPort(raw);
  if (port === undefined) {
    return translateCli('validators.tcpPort.invalid', { example: TCP_PORT_EXAMPLE });
  }

  const dockerPorts = await getDockerPublishedTcpPorts();
  if (dockerPorts.has(port)) {
    return translateCli('validators.tcpPort.alreadyInUseByDocker', { port });
  }

  const available = await canListenOnTcpPort(port);
  if (!available) {
    return translateCli('validators.tcpPort.alreadyInUse', { port });
  }

  return undefined;
}
