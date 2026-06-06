/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IncomingMessage } from 'http';
import { IncomingRequest } from '.';

// Fixed on-disk build-output directory name for the modern (v2) client, and
// the sentinel segment baked into its HTML at build time. NOT the runtime URL
// prefix (that is APP_MODERN_CLIENT_PREFIX, read per-request). A sibling copy
// of this default lives in packages/core/cli-v1/src/util.js
// (DEFAULT_MODERN_CLIENT_PREFIX). See docs/adr/0001-modern-client-prefix.md.
export const MODERN_CLIENT_DIST_DIR = 'v';

export function resolvePublicPath(appPublicPath = '/') {
  const normalized = String(appPublicPath || '/').trim() || '/';
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

// Normalize APP_MODERN_CLIENT_PREFIX (accepts `v`, `/v`, `/v/`)
// down to a bare segment. Falls back to the fixed dist dir name.
export function normalizeModernClientPrefix(value?: string) {
  const segment = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return segment || MODERN_CLIENT_DIST_DIR;
}

export function resolveV2PublicPath(appPublicPath = '/') {
  const publicPath = resolvePublicPath(appPublicPath);
  const prefix = normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX);
  return `${publicPath.replace(/\/$/, '')}/${prefix}/`;
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

export function rewriteV2AssetPublicPath(html: string, assetPublicPath: string) {
  const normalizedAssetPublicPath = ensureTrailingSlash(assetPublicPath);
  // HTML is built with the fixed dist-dir sentinel (`/v/`) baked into
  // asset URLs; rewrite it to the runtime asset path when they differ.
  const sentinel = `/${MODERN_CLIENT_DIST_DIR}/`;
  if (normalizedAssetPublicPath === sentinel) {
    return html;
  }

  const sentinelPattern = new RegExp(`((?:src|href)=["'])${sentinel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
  return html.replace(sentinelPattern, `$1${normalizedAssetPublicPath}`);
}

export function injectRuntimeScript(html: string, runtimeScript: string) {
  const browserCheckerScriptMatch = html.match(/<script\b[^>]*browser-checker\.js[^>]*><\/script>/i);

  if (browserCheckerScriptMatch?.[0]) {
    return html.replace(browserCheckerScriptMatch[0], `${runtimeScript}\n${browserCheckerScriptMatch[0]}`);
  }

  const moduleScriptMatch = html.match(/<script\b[^>]*type=["']module["'][^>]*>/i);

  if (moduleScriptMatch?.[0]) {
    return html.replace(moduleScriptMatch[0], `${runtimeScript}\n${moduleScriptMatch[0]}`);
  }

  if (html.includes('</head>')) {
    return html.replace('</head>', `${runtimeScript}\n</head>`);
  }

  return `${runtimeScript}\n${html}`;
}

function splitCommaSeparatedValues(value: string, limit: number) {
  return value.split(',', limit).map((v) => v.trim());
}

export function getHost(req: IncomingMessage | IncomingRequest) {
  let host = req.headers['x-forwarded-host'];
  if (!host) {
    host = req.headers[':authority'] || req.headers['host'];
  }
  if (!host) return '';
  host = splitCommaSeparatedValues(host as string, 1)[0];
  // Host header may contain userinfo (e.g., "user@host") which is invalid per RFC 7230.
  // Use URL parser to correctly extract the host portion.
  if (host.includes('@')) {
    try {
      host = new URL(`http://${host}`).host;
    } catch (e) {
      return '';
    }
  }
  return host;
}

export function getHostname(req: IncomingMessage | IncomingRequest) {
  const host = getHost(req);
  if (!host) return '';
  return host.split(':', 1)[0];
}
