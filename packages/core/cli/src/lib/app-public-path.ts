/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_APP_PUBLIC_PATH = '/';
const DEFAULT_DIST_SEGMENT = 'dist';
const DIST_CLIENT_DIR = 'dist-client';
const DIST_CLIENT_ACTIVE_VERSION_FILE = 'active-version';

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

export function resolveAppPublicPath(appPublicPath = DEFAULT_APP_PUBLIC_PATH): string {
  const normalized = String(appPublicPath || DEFAULT_APP_PUBLIC_PATH)
    .trim()
    .replace(/\/+/g, '/')
    .replace(/\/?$/, '/');
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash || DEFAULT_APP_PUBLIC_PATH;
}

export function appendAppPublicPath(appPublicPath: string | undefined, segment: string, options?: { trailingSlash?: boolean }) {
  const publicPath = resolveAppPublicPath(appPublicPath).replace(/\/+$/, '');
  const normalizedSegment = String(segment || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(options?.trailingSlash ? /\/+$/ : /\/*$/, '');
  const joinedPath = normalizedSegment ? `${publicPath}/${normalizedSegment}` : publicPath || '/';
  if (options?.trailingSlash) {
    return joinedPath.endsWith('/') ? joinedPath : `${joinedPath}/`;
  }
  return joinedPath || '/';
}

export function resolveDistPublicPath(appPublicPath?: string): string {
  return appendAppPublicPath(appPublicPath, DEFAULT_DIST_SEGMENT, { trailingSlash: true });
}

export function buildDefaultCdnBaseUrl(appPublicPath: string | undefined, version: string): string {
  const normalizedVersion = String(version || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return `${resolveDistPublicPath(appPublicPath)}${normalizedVersion}/`;
}

export function buildLocalAppUrl(port?: string, appPublicPath?: string): string | undefined {
  const value = trimValue(port);
  if (!value) {
    return undefined;
  }
  const publicPath = resolveAppPublicPath(appPublicPath);
  return publicPath === '/' ? `http://127.0.0.1:${value}` : `http://127.0.0.1:${value}${publicPath}`;
}

export function buildLocalApiBaseUrl(port?: string, appPublicPath?: string): string | undefined {
  const value = trimValue(port);
  if (!value) {
    return undefined;
  }
  return `http://127.0.0.1:${value}${appendAppPublicPath(appPublicPath, 'api', { trailingSlash: false })}`;
}

export function resolveDistClientRoot(storagePath: string): string {
  return path.join(storagePath, DIST_CLIENT_DIR);
}

export function resolveDistClientVersionRoot(storagePath: string, version: string): string {
  return path.join(resolveDistClientRoot(storagePath), version);
}

export function resolveDistClientActiveVersionFile(storagePath: string): string {
  return path.join(resolveDistClientRoot(storagePath), DIST_CLIENT_ACTIVE_VERSION_FILE);
}

export async function readDistClientActiveVersion(storagePath: string): Promise<string | undefined> {
  try {
    const content = await readFile(resolveDistClientActiveVersionFile(storagePath), 'utf8');
    return trimValue(content);
  } catch {
    return undefined;
  }
}
