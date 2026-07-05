/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type EnvProxyProvider = 'nginx' | 'caddy';

export interface EnvProxyProviderConfig {
  [key: string]: unknown;
}

export interface EnvResolvedProxyEntry extends EnvProxyProviderConfig {
  host?: string;
  port?: number;
}

export interface EnvProxyConfig {
  host?: string;
  port?: number;
  nginx?: EnvProxyProviderConfig;
  caddy?: EnvProxyProviderConfig;
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

function normalizeOptionalPort(value: unknown): number | undefined {
  const normalized = normalizeOptionalString(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return undefined;
  }

  const port = Number(normalized);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return undefined;
  }

  return port;
}

export function normalizeEnvProxyProviderConfig(value: unknown): EnvProxyProviderConfig | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return { ...(value as Record<string, unknown>) };
}

export function normalizeEnvProxyConfig(value: unknown): EnvProxyConfig | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const proxy = value as { host?: unknown; port?: unknown; nginx?: unknown; caddy?: unknown };
  const host = normalizeOptionalString(proxy.host);
  const port = normalizeOptionalPort(proxy.port);
  const nginx = normalizeEnvProxyProviderConfig(proxy.nginx);
  const caddy = normalizeEnvProxyProviderConfig(proxy.caddy);

  if (!host && port === undefined && !nginx && !caddy) {
    return undefined;
  }

  return {
    ...(host ? { host } : {}),
    ...(port !== undefined ? { port } : {}),
    ...(nginx ? { nginx } : {}),
    ...(caddy ? { caddy } : {}),
  };
}
