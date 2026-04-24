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
const ENV_KEY_PATTERN = /^[A-Za-z0-9]+$/;
const TCP_PORT_EXAMPLE = '13000';

export function validateApiBaseUrl(value: PromptValue): string | undefined {
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

async function canListenOnTcpPort(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const server = net.createServer();

    const resolveAndCleanup = (result: boolean) => {
      server.removeAllListeners();
      if (server.listening) {
        server.close(() => resolve(result));
      } else {
        resolve(result);
      }
    };

    server.once('error', () => {
      resolveAndCleanup(false);
    });

    server.once('listening', () => {
      resolveAndCleanup(true);
    });

    server.listen(port, '127.0.0.1');
  });
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

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = await allocateAvailableTcpPort();
    if (!dockerPorts.has(Number.parseInt(candidate, 10))) {
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
  const port = parseTcpPort(raw)!;

  const available = await canListenOnTcpPort(port);
  if (!available) {
    return translateCli('validators.tcpPort.alreadyInUse', { port });
  }

  const dockerPorts = await getDockerPublishedTcpPorts();
  if (dockerPorts.has(port)) {
    return translateCli('validators.tcpPort.alreadyInUseByDocker', { port });
  }

  return undefined;
}
