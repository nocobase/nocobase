/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type JsonRecord = Record<string, unknown>;

export interface AdminScriptArgs {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
}

export function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function getString(value: unknown) {
  if (typeof value === 'number') {
    return String(value);
  }
  return typeof value === 'string' ? value.trim() : '';
}

export function getListItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value.data)) {
    return value.data.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value.rows)) {
    return value.rows.filter(isRecord);
  }
  return [];
}

export function unwrapResponse(json: unknown): unknown {
  const record = isRecord(json) ? json : {};
  const data = record.data;
  if (isRecord(data) && Object.prototype.hasOwnProperty.call(data, 'data')) {
    return data.data;
  }
  return data === undefined ? record : data;
}

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: { method?: 'GET' | 'POST'; token?: string; nodeToken?: string; body?: JsonRecord | unknown[] } = {},
) {
  const response = await fetch(new URL(path, baseUrl), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'X-Authenticator': 'basic',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token || options.nodeToken ? { Authorization: `Bearer ${options.token || options.nodeToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as unknown) : {};
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${path}: ${text}`);
  }
  return unwrapResponse(json) as T;
}

export async function signIn(args: AdminScriptArgs) {
  const data = await requestJson<JsonRecord>(args.baseUrl, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: args.adminEmail,
      password: args.adminPassword,
    },
  });
  const token = getString(data.token);
  if (!token) {
    throw new Error('Sign-in response did not include a token');
  }
  return token;
}

export function parseAdminFlags(argv: string[]) {
  const flags: Record<string, string> = {};
  const booleanFlags = new Set<string>();
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--')) {
      continue;
    }
    if (!value || value.startsWith('--')) {
      booleanFlags.add(key.slice(2));
      continue;
    }
    flags[key.slice(2)] = value;
    index += 1;
  }
  return {
    flags,
    booleanFlags,
  };
}

export function parseAdminArgs(argv: string[]): AdminScriptArgs {
  const { flags } = parseAdminFlags(argv);
  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  if (!baseUrl || !adminEmail || !adminPassword) {
    throw new Error('--base-url, --admin-email, and --admin-password are required');
  }
  return {
    baseUrl,
    adminEmail,
    adminPassword,
  };
}

export async function findOneByFilter(baseUrl: string, token: string, collection: string, filter: JsonRecord) {
  const search = new URLSearchParams();
  search.set('filter', JSON.stringify(filter));
  const data = await requestJson<unknown>(baseUrl, `/api/${collection}:list?${search.toString()}`, {
    token,
  });
  return getListItems(data)[0] || null;
}
