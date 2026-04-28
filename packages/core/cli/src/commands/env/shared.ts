/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildDockerDbContainerName,
  dockerContainerExists,
  dockerContainerIsRunning,
  type ManagedAppRuntime,
} from '../../lib/app-runtime.js';
import { executeRawApiRequest } from '../../lib/api-client.js';
import type { AuthStoreOptions } from '../../lib/auth-store.js';

export type RuntimeStatus = 'running' | 'stopped' | 'missing' | 'http' | 'ssh' | 'external' | '-';
export type EnvApiStatus = 'ok' | 'auth failed' | 'unreachable' | 'unconfigured' | 'error';

export function resolveApiBaseUrl(config: {
  apiBaseUrl?: unknown;
  baseUrl?: unknown;
  apibaseUrl?: unknown;
}): string {
  return String(config.apiBaseUrl ?? config.baseUrl ?? config.apibaseUrl ?? '').trim();
}

export function appUrl(runtime: ManagedAppRuntime): string {
  const port = String(runtime.env.config.appPort ?? '').trim();
  if (port) {
    return `http://127.0.0.1:${port}`;
  }

  const baseUrl = resolveApiBaseUrl(runtime.env.config);
  return baseUrl.replace(/\/api\/?$/, '');
}

export function appRootPath(runtime: ManagedAppRuntime): string {
  if (runtime.kind === 'http' || runtime.kind === 'docker') {
    return '-';
  }

  if (runtime.kind === 'local') {
    return String(runtime.projectRoot ?? runtime.env.appRootPath ?? '').trim() || '-';
  }

  return String(runtime.env.config.appRootPath ?? '').trim() || '-';
}

export function storagePath(runtime: ManagedAppRuntime): string {
  if (runtime.kind === 'http') {
    return '-';
  }

  const value = String(runtime.env.storagePath ?? runtime.env.config.storagePath ?? '').trim();
  return value || '-';
}

function collectErrorCodes(value: unknown): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectErrorCodes(item));
  }

  const out: string[] = [];
  const record = value as Record<string, unknown>;
  if (typeof record.code === 'string') {
    out.push(record.code);
  }
  for (const key of ['data', 'error', 'errors']) {
    out.push(...collectErrorCodes(record[key]));
  }

  return out;
}

function isAuthFailureData(value: unknown): boolean {
  const codes = collectErrorCodes(value);
  return codes.some((code) =>
    ['EMPTY_TOKEN', 'INVALID_TOKEN', 'EXPIRED_TOKEN', 'BLOCKED_TOKEN', 'EXPIRED_SESSION', 'NOT_EXIST_USER'].includes(code),
  );
}

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'AbortError'
    || /fetch failed|network|timeout|timed out|abort|ECONNREFUSED|ECONNRESET|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|ENETUNREACH/i.test(error.message)
  );
}

function isUnconfiguredFailure(error: unknown): boolean {
  return error instanceof Error && /missing (a )?base url|missing base URL/i.test(error.message);
}

function isAuthFailure(error: unknown): boolean {
  return (
    error instanceof Error
    && /EMPTY_TOKEN|INVALID_TOKEN|EXPIRED_TOKEN|BLOCKED_TOKEN|EXPIRED_SESSION|NOT_EXIST_USER|invalid_grant|sign in|signin|authentication failed/i.test(error.message)
  );
}

export async function apiStatus(
  envName: string,
  config: Parameters<typeof resolveApiBaseUrl>[0],
  options: { scope?: AuthStoreOptions['scope']; timeoutMs?: number } = {},
): Promise<EnvApiStatus> {
  if (!resolveApiBaseUrl(config)) {
    return 'unconfigured';
  }

  try {
    const response = await executeRawApiRequest({
      envName,
      scope: options.scope,
      method: 'GET',
      path: '/auth:check',
      timeoutMs: options.timeoutMs ?? 2000,
    });

    if (response.ok) {
      return 'ok';
    }

    if (response.status === 401 || response.status === 403 || isAuthFailureData(response.data)) {
      return 'auth failed';
    }

    return 'error';
  } catch (error) {
    if (isUnconfiguredFailure(error)) {
      return 'unconfigured';
    }

    if (isAuthFailure(error)) {
      return 'auth failed';
    }

    if (isNetworkFailure(error)) {
      return 'unreachable';
    }

    return 'error';
  }
}

async function isLocalAppHealthy(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): Promise<boolean> {
  const port = String(runtime.env.config.appPort ?? '').trim();
  if (!port) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/__health_check`, {
      signal: controller.signal,
    });
    const text = await response.text();
    return response.ok && text.trim().toLowerCase() === 'ok';
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function dockerStatus(containerName: string): Promise<RuntimeStatus> {
  if (!(await dockerContainerExists(containerName))) {
    return 'missing';
  }

  return await dockerContainerIsRunning(containerName) ? 'running' : 'stopped';
}

export async function dbStatus(runtime: ManagedAppRuntime): Promise<RuntimeStatus> {
  if (!runtime.env.config.builtinDb) {
    return runtime.kind === 'http' ? 'external' : '-';
  }

  if (runtime.kind === 'http') {
    return 'external';
  }

  if (runtime.kind === 'ssh') {
    return '-';
  }

  const dbDialect = String(runtime.env.config.dbDialect ?? 'postgres').trim() || 'postgres';
  const containerName = buildDockerDbContainerName(runtime.envName, dbDialect, runtime.workspaceName);
  return await dockerStatus(containerName);
}

export async function runtimeStatus(runtime: ManagedAppRuntime): Promise<RuntimeStatus> {
  if (runtime.kind === 'http') {
    return 'http';
  }

  if (runtime.kind === 'ssh') {
    return 'ssh';
  }

  if (runtime.kind === 'docker') {
    return await dockerStatus(runtime.containerName);
  }

  return await isLocalAppHealthy(runtime) ? 'running' : 'stopped';
}
