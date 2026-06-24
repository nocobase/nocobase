/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IncomingMessage } from 'http';
import { extname } from 'node:path';
import type { IncomingRequest } from '.';

// Fixed on-disk build-output directory name for the modern (v2) client, and
// the sentinel segment baked into its HTML at build time. NOT the runtime URL
// prefix (that is APP_MODERN_CLIENT_PREFIX, read per-request). A sibling copy
// of this default lives in packages/core/cli-v1/src/util.js
// (DEFAULT_MODERN_CLIENT_PREFIX). See docs/adr/0001-modern-client-prefix.md.
export const MODERN_CLIENT_DIST_DIR = 'v';
export type AppClientEntryMode = 'legacy-default' | 'modern-default' | 'modern-only';
const APP_CLIENT_ENTRY_MODES = new Set<AppClientEntryMode>(['legacy-default', 'modern-default', 'modern-only']);

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

function normalizeAppClientEntryMode(value?: string): AppClientEntryMode | undefined {
  const normalized = String(value || '').trim() as AppClientEntryMode;
  return APP_CLIENT_ENTRY_MODES.has(normalized) ? normalized : undefined;
}

export function resolveModernClientPublicPath(appPublicPath = '/', modernClientPrefix?: string) {
  const publicPath = resolvePublicPath(appPublicPath);
  const prefix = normalizeModernClientPrefix(modernClientPrefix ?? process.env.APP_MODERN_CLIENT_PREFIX);
  return `${publicPath.replace(/\/$/, '')}/${prefix}/`;
}

export function resolveV2PublicPath(appPublicPath = '/') {
  return resolveModernClientPublicPath(appPublicPath);
}

// Canonicalize a request pathname into a root-relative path with collapsed
// duplicate slashes and no trailing slash except `/`. The redirect helpers use
// this so every branch compares the same path shape.
function normalizeRootRelativePath(pathname = '/') {
  const normalized = String(pathname || '/').trim() || '/';
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const deduped = withLeadingSlash.replace(/\/{2,}/g, '/');
  if (deduped !== '/' && deduped.endsWith('/')) {
    return deduped.replace(/\/+$/g, '');
  }
  return deduped || '/';
}

function trimTrailingSlash(pathname: string) {
  return pathname === '/' ? pathname : pathname.replace(/\/+$/g, '');
}

function isRootIndexPath(pathname: string) {
  const normalized = normalizeRootRelativePath(pathname);
  return normalized === '/' || normalized === '/index.html';
}

// Remove the app mount path from an absolute request pathname and return the
// remaining app-internal pathname. Returns `null` when the request is outside
// the app mount entirely.
function removeBasePath(pathname: string, basePath: string) {
  const normalizedPathname = normalizeRootRelativePath(pathname);
  const normalizedBasePath = resolvePublicPath(basePath);
  if (normalizedBasePath === '/') {
    return normalizedPathname;
  }
  const baseWithoutTrailingSlash = normalizedBasePath.replace(/\/$/, '');
  if (normalizedPathname === baseWithoutTrailingSlash) {
    return '/';
  }
  if (!normalizedPathname.startsWith(normalizedBasePath)) {
    return null;
  }
  return normalizeRootRelativePath(normalizedPathname.slice(normalizedBasePath.length - 1));
}

function joinRootRelativePath(basePath: string, relativePath: string) {
  const normalizedBasePath = resolvePublicPath(basePath);
  const normalizedRelativePath = normalizeRootRelativePath(relativePath);
  if (normalizedBasePath === '/') {
    return normalizedRelativePath;
  }
  if (normalizedRelativePath === '/') {
    return normalizedBasePath;
  }
  return normalizeRootRelativePath(`${trimTrailingSlash(normalizedBasePath)}${normalizedRelativePath}`);
}

// Build the modern-only redirect target for a site-root request that has not
// yet entered APP_PUBLIC_PATH. This is intentionally a prefix rewrite, not a
// semantic route translation.
function buildModernOnlyRedirectTarget(
  pathname: string,
  appPublicPath: string,
  v2PublicPath: string,
  modernPrefix: string,
) {
  const normalizedPathname = normalizeRootRelativePath(pathname);
  if (isRootIndexPath(normalizedPathname)) {
    return normalizedPathname === '/index.html' ? `${v2PublicPath}index.html` : v2PublicPath;
  }
  if (normalizedPathname === `/${modernPrefix}`) {
    return v2PublicPath;
  }
  if (normalizedPathname === `/${modernPrefix}/index.html`) {
    return `${v2PublicPath}index.html`;
  }
  if (normalizedPathname.startsWith(`/${modernPrefix}/`)) {
    return joinRootRelativePath(appPublicPath, normalizedPathname);
  }
  return joinRootRelativePath(appPublicPath, `/${modernPrefix}${normalizedPathname}`);
}

// Decide how the site root (`/`) should enter the mounted app when
// APP_PUBLIC_PATH is a sub-path. legacy-default lands on APP_PUBLIC_PATH; the
// modern modes may jump directly to the modern client public path.
function buildSiteRootRedirectTarget(
  pathname: string,
  appPublicPath: string,
  v2PublicPath: string,
  modernPrefix: string,
  mode?: AppClientEntryMode,
) {
  const normalizedPathname = normalizeRootRelativePath(pathname);
  if (mode === 'modern-only') {
    return buildModernOnlyRedirectTarget(normalizedPathname, appPublicPath, v2PublicPath, modernPrefix);
  }
  if (mode === 'modern-default' && isRootIndexPath(normalizedPathname)) {
    return normalizedPathname === '/index.html' ? `${v2PublicPath}index.html` : v2PublicPath;
  }
  return joinRootRelativePath(appPublicPath, normalizedPathname);
}

// Decide whether an app-internal request under APP_PUBLIC_PATH should stay on
// the legacy entry or redirect into the modern entry.
function buildAppRootRedirectTarget(relativePath: string, v2PublicPath: string, mode?: AppClientEntryMode) {
  const normalizedRelativePath = normalizeRootRelativePath(relativePath);
  if (mode !== 'modern-default' && mode !== 'modern-only') {
    return null;
  }
  if (mode === 'modern-default') {
    if (!isRootIndexPath(normalizedRelativePath)) {
      return null;
    }
    return normalizedRelativePath === '/index.html' ? `${v2PublicPath}index.html` : v2PublicPath;
  }
  if (normalizedRelativePath === '/') {
    return v2PublicPath;
  }
  return `${trimTrailingSlash(v2PublicPath)}${normalizedRelativePath}`;
}

export function isClientDocumentEntryRequest(pathname: string) {
  const normalizedPathname = normalizeRootRelativePath(pathname);
  return isRootIndexPath(normalizedPathname) || extname(normalizedPathname) === '';
}

type ResolveClientEntryRedirectOptions = {
  appPublicPath?: string;
  modernClientPrefix?: string;
  mode?: string;
  apiBasePath?: string;
  wsPath?: string;
  pluginStaticsPath?: string;
};

export function resolveClientEntryRedirectTarget(pathname: string, options: ResolveClientEntryRedirectOptions = {}) {
  const appPublicPath = resolvePublicPath(options.appPublicPath || '/');
  const modernClientPrefix = normalizeModernClientPrefix(options.modernClientPrefix);
  const v2PublicPath = resolveModernClientPublicPath(appPublicPath, modernClientPrefix);
  const mode = normalizeAppClientEntryMode(options.mode);
  const normalizedPathname = normalizeRootRelativePath(pathname);
  const apiBasePath = options.apiBasePath ?? process.env.API_BASE_PATH ?? '/api';
  const wsPath = options.wsPath ?? process.env.WS_PATH ?? '/ws';
  const pluginStaticsPath = options.pluginStaticsPath ?? process.env.PLUGIN_STATICS_PATH ?? '/static/plugins/';
  const absoluteProtectedPrefixes = [
    apiBasePath,
    wsPath,
    pluginStaticsPath,
    `${trimTrailingSlash(appPublicPath)}/storage/uploads/`,
    `${trimTrailingSlash(appPublicPath)}/dist/`,
  ]
    .filter(Boolean)
    .map((value) => resolvePublicPath(String(value)).replace(/\/$/, ''));
  const siteRootProtectedPrefixes =
    appPublicPath === '/'
      ? []
      : absoluteProtectedPrefixes
          .map((value) => removeBasePath(`${value}/`, appPublicPath))
          .filter(Boolean)
          .map((value) => trimTrailingSlash(String(value)));

  // Root-mounted metadata endpoints are real backend resources with
  // extensionless paths. They must bypass client-entry routing even in
  // modern-only mode.
  if (normalizedPathname.startsWith('/.well-known/')) {
    return null;
  }

  for (const prefix of absoluteProtectedPrefixes) {
    if (normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`)) {
      return null;
    }
  }

  if (normalizedPathname === trimTrailingSlash(v2PublicPath) || normalizedPathname.startsWith(v2PublicPath)) {
    return null;
  }

  const relativePath = removeBasePath(normalizedPathname, appPublicPath);
  if (relativePath != null) {
    if (!isClientDocumentEntryRequest(relativePath)) {
      return null;
    }
    return buildAppRootRedirectTarget(relativePath, v2PublicPath, mode);
  }

  if (appPublicPath === '/' || !isClientDocumentEntryRequest(normalizedPathname)) {
    return null;
  }

  for (const prefix of siteRootProtectedPrefixes) {
    if (normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`)) {
      return null;
    }
  }

  return buildSiteRootRedirectTarget(normalizedPathname, appPublicPath, v2PublicPath, modernClientPrefix, mode);
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
